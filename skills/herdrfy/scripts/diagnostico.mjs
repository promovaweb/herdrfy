#!/usr/bin/env node
/**
 * Arquivo: skills/herdrfy/scripts/diagnostico.mjs
 * Descrição: Mostra o estado da instalação do Herdr nesta máquina, sem
 * alterar nada: binários e versões, servidores, integrações do TUI, skills,
 * templates do herdr-core, agentes de código e arquivos de configuração.
 * A skill usa a resposta para saber o que falta configurar.
 *
 * Uso:
 *   node diagnostico.mjs          texto legível
 *   node diagnostico.mjs --json   objeto JSON
 *
 * Saída JSON: { ambiente, binarios, servidores, integracoes, skills,
 * templates, agentes, configuracao, pendencias }. `pendencias` lista, em
 * texto, cada item ausente com o comando que o resolve.
 *
 * Código de saída: 0 sempre que o diagnóstico rodou; as faltas aparecem em
 * `pendencias`, não no código de saída.
 *
 * Dependências: Node.js 18 ou mais novo.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const json = process.argv.includes("--json");
const casa = homedir();
const configHome = process.env.XDG_CONFIG_HOME || join(casa, ".config");

/** Executa um comando e devolve a saída, ou `undefined` quando ele falha. */
function tentar(comando, argumentos) {
  try {
    return execFileSync(comando, argumentos, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000 }).trim();
  } catch {
    return undefined;
  }
}

/** Devolve o caminho de um executável no PATH, ou `null`. */
function caminhoDe(comando) {
  const saida = tentar(process.platform === "win32" ? "where" : "which", [comando]);
  return saida ? saida.split("\n")[0] : null;
}

/** Monta `{ caminho, versao }` de um executável. */
function binario(comando, argVersao = "--version") {
  const caminho = caminhoDe(comando);
  if (!caminho) return { caminho: null, versao: null };
  const versao = tentar(comando, [argVersao]);
  return { caminho, versao: versao ? versao.split("\n")[0] : null };
}

/** Lista os nomes dos itens de uma pasta, ou vazio quando ela não existe. */
function listar(pasta) {
  try {
    return readdirSync(pasta);
  } catch {
    return [];
  }
}

const binarios = {
  herdr: binario("herdr"),
  hc: binario("hc"),
  "herdr-app": binario("herdr-app"),
  node: binario("node"),
};

const servidores = { tui: null, core: null };
if (binarios.herdr.caminho) {
  const status = tentar("herdr", ["status"]);
  servidores.tui = status ? (/status:\s*running/u.test(status) ? "rodando" : "parado") : "sem resposta";
}
if (binarios.hc.caminho) {
  // `hc server status` não inicia um core; só informa o que já roda.
  const status = tentar("hc", ["server", "status", "--json"]);
  try {
    const dados = JSON.parse(status ?? "");
    servidores.core = dados.pid ? `rodando (${dados.live ?? 0} terminais vivos)` : "parado";
  } catch {
    servidores.core = "sem resposta";
  }
}

// Integrações do TUI: linhas no formato "claude: current (v11) (/caminho)".
const integracoes = {};
if (binarios.herdr.caminho) {
  const saida = tentar("herdr", ["integration", "status"]) ?? "";
  for (const linha of saida.split("\n")) {
    const achado = /^([a-z-]+)(?: \([a-z]+\))?: (current|outdated|not installed)/u.exec(linha);
    if (achado) integracoes[achado[1]] = achado[2] === "current" ? "em dia" : achado[2] === "outdated" ? "desatualizada" : "ausente";
  }
}

// Skills: procura nas pastas globais e nas do projeto atual.
const pastasDeSkills = [
  join(casa, ".agents", "skills"),
  join(casa, ".claude", "skills"),
  join(casa, ".codex", "skills"),
  join(configHome, "opencode", "skills"),
  join(process.cwd(), ".agents", "skills"),
  join(process.cwd(), ".claude", "skills"),
];
const skills = {};
for (const nome of ["herdrfy", "herdr", "herdr-core"]) {
  skills[nome] = pastasDeSkills.filter((pasta) => existsSync(join(pasta, nome, "SKILL.md")));
}

const pastaTemplates = join(configHome, "herdr-core", "templates");
const templates = listar(pastaTemplates).filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3));

const agentes = {
  claude: binario("claude"),
  codex: binario("codex"),
  opencode: binario("opencode"),
};

const configuracao = {
  tui: { arquivo: join(configHome, "herdr", "config.toml"), existe: existsSync(join(configHome, "herdr", "config.toml")) },
  core: { arquivo: join(configHome, "herdr-core", "config.toml"), existe: existsSync(join(configHome, "herdr-core", "config.toml")) },
  desktop: { arquivo: join(process.env.HERDR_APP_HOME || join(configHome, "herdr-app"), "AGENTS.md"), existe: existsSync(join(process.env.HERDR_APP_HOME || join(configHome, "herdr-app"), "AGENTS.md")) },
};

const ambiente = {
  HC_TERMINAL_ID: process.env.HC_TERMINAL_ID ?? null,
  HERDR_ENV: process.env.HERDR_ENV ?? null,
  HERDR_PANE_ID: process.env.HERDR_PANE_ID ?? null,
};

const pendencias = [];
if (!binarios.herdr.caminho && !binarios.hc.caminho) pendencias.push("Nenhum Herdr instalado. TUI: curl -fsSL https://herdr.dev/install.sh | sh. Desktop: curl -fsSL https://releases.herdr.dev/app/install.sh | sh.");
if (binarios.herdr.caminho && skills.herdr.length === 0) pendencias.push("Skill herdr ausente: npx skills add herdrdev/herdr --skill herdr -g");
if (binarios.hc.caminho && skills["herdr-core"].length === 0) pendencias.push("Skill herdr-core ausente: npx skills add herdrdev/herdr-core --skill herdr-core -g");
if (binarios.herdr.caminho) {
  for (const agente of Object.keys(agentes)) {
    if (!agentes[agente].caminho) continue;
    if (integracoes[agente] === "ausente") pendencias.push(`Integração do TUI ausente para ${agente}: herdr integration install ${agente}`);
    if (integracoes[agente] === "desatualizada") pendencias.push(`Integração do TUI desatualizada para ${agente}: herdr integration install ${agente}`);
  }
}
if (binarios.hc.caminho) {
  for (const nome of ["claude-yolo", "codex-yolo", "opencode-yolo"]) {
    const agente = nome.split("-")[0];
    if (agentes[agente].caminho && !templates.includes(nome)) pendencias.push(`Template ${nome} ausente em ${pastaTemplates}: copie de assets/templates/${nome}.md`);
  }
}
for (const agente of Object.keys(agentes)) {
  if (!agentes[agente].caminho) pendencias.push(`Agente ${agente} não está no PATH desta máquina.`);
}

const dados = { ambiente, binarios, servidores, integracoes, skills, templates: { pasta: pastaTemplates, nomes: templates }, agentes, configuracao, pendencias };

if (json) {
  console.log(JSON.stringify(dados, null, 2));
} else {
  const linha = (rotulo, valor) => console.log(`${rotulo.padEnd(22)}${valor}`);
  console.log("Binários");
  for (const [nome, b] of Object.entries(binarios)) linha(`  ${nome}`, b.caminho ? `${b.versao ?? "versão desconhecida"} (${b.caminho})` : "ausente");
  console.log("Servidores");
  linha("  Herdr TUI", servidores.tui ?? "sem binário");
  linha("  herdr-core", servidores.core ?? "sem binário");
  console.log("Ambiente deste processo");
  for (const [nome, valor] of Object.entries(ambiente)) linha(`  ${nome}`, valor ?? "vazio");
  console.log("Agentes de código");
  for (const [nome, b] of Object.entries(agentes)) linha(`  ${nome}`, b.caminho ? `${b.versao ?? "versão desconhecida"}${integracoes[nome] ? `, integração do TUI ${integracoes[nome]}` : ""}` : "ausente");
  console.log("Skills");
  for (const [nome, pastas] of Object.entries(skills)) linha(`  ${nome}`, pastas.length > 0 ? pastas.join(", ") : "ausente");
  console.log("Templates do herdr-core");
  linha("  pasta", pastaTemplates);
  linha("  nomes", templates.length > 0 ? templates.join(", ") : "nenhum");
  console.log("Configuração");
  for (const [nome, c] of Object.entries(configuracao)) linha(`  ${nome}`, `${c.arquivo}${c.existe ? "" : " (não existe)"}`);
  console.log(pendencias.length > 0 ? "Pendências" : "Pendências: nenhuma");
  for (const p of pendencias) console.log(`  - ${p}`);
}
