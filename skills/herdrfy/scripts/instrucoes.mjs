#!/usr/bin/env node
/**
 * Arquivo: skills/herdrfy/scripts/instrucoes.mjs
 * Descrição: Grava, confere ou remove o bloco de instruções do Herdrfy nos
 * arquivos `AGENTS.md` e `CLAUDE.md`, para que todo agente aberto no projeto
 * (ou na máquina) saiba se localizar no Herdr, iniciar agentes com as flags de
 * permissão e abrir painéis na aba de quem pediu.
 *
 * Uso:
 *   node instrucoes.mjs                      projeto da pasta atual
 *   node instrucoes.mjs --projeto <pasta>    outro projeto
 *   node instrucoes.mjs --global             arquivos globais dos agentes
 *   node instrucoes.mjs --arquivo <caminho>  um arquivo específico (repetível)
 *   node instrucoes.mjs --check              só confere; sai com 1 se faltar
 *   node instrucoes.mjs --remover            tira o bloco
 *   node instrucoes.mjs --json               resposta em JSON
 *
 * Projeto: o bloco entra em `AGENTS.md` e em `CLAUDE.md`. Quando um é link
 * para o outro, o arquivo real recebe o bloco uma vez só. Quando `CLAUDE.md`
 * não existe, ele nasce como link para `AGENTS.md`; se o sistema recusar o
 * link, nasce como arquivo com o mesmo bloco.
 *
 * Global: `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` e
 * `~/.config/opencode/AGENTS.md`, só nas pastas de agente que já existem.
 *
 * O bloco fica entre os marcadores `<!-- herdrfy:inicio -->` e
 * `<!-- herdrfy:fim -->`. Rodar de novo troca o conteúdo entre os marcadores
 * e preserva o resto do arquivo. O texto vem de `assets/instrucoes-bloco.md`,
 * com `{{ONDE}}` trocado pelo comando do localizador desta instalação.
 *
 * Aviso de conflito: quando o arquivo, fora do bloco, manda iniciar agentes
 * por alias (`zsh -ic`, `cc`, `cx`, `oc`), a resposta traz `conflitos` com
 * os números das linhas. O script não altera essas linhas.
 *
 * Códigos de saída: 0 feito ou em dia, 1 `--check` encontrou arquivo sem o
 * bloco atual, 2 argumento inválido.
 *
 * Dependências: Node.js 18 ou mais novo.
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const INICIO = "<!-- herdrfy:inicio -->";
const FIM = "<!-- herdrfy:fim -->";
const aqui = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const opcoes = { check: false, remover: false, json: false, global: false, projeto: undefined, arquivos: [] };
for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  if (a === "--check") opcoes.check = true;
  else if (a === "--remover") opcoes.remover = true;
  else if (a === "--json") opcoes.json = true;
  else if (a === "--global") opcoes.global = true;
  else if (a === "--projeto") opcoes.projeto = args[++i];
  else if (a === "--arquivo") opcoes.arquivos.push(args[++i]);
  else {
    console.error(`Argumento desconhecido: ${a}`);
    process.exit(2);
  }
}
if (opcoes.projeto === undefined && args.includes("--projeto")) {
  console.error("--projeto pede uma pasta.");
  process.exit(2);
}
if (opcoes.arquivos.some((a) => a === undefined)) {
  console.error("--arquivo pede um caminho.");
  process.exit(2);
}

/** Escreve um caminho com `~` quando ele fica dentro da pasta pessoal. */
function comTil(caminho) {
  const casa = homedir();
  return caminho === casa || caminho.startsWith(casa + sep) ? `~${caminho.slice(casa.length)}`.split(sep).join("/") : caminho;
}

/**
 * Monta o comando do localizador como ele deve aparecer no bloco: caminho
 * relativo quando a skill está dentro do projeto, caminho com `~` nos outros
 * casos, para o bloco continuar válido em outras máquinas com a mesma pasta
 * pessoal.
 */
function comandoOnde(base) {
  const onde = join(aqui, "onde.mjs");
  if (base) {
    const rel = relative(base, onde);
    if (!rel.startsWith("..") && !isAbsolute(rel)) return `node ${rel.split(sep).join("/")}`;
  }
  return `node ${comTil(onde)}`;
}

/** Lê o modelo do bloco e devolve o texto final, entre os marcadores. */
function montarBloco(base) {
  const modelo = readFileSync(join(aqui, "..", "assets", "instrucoes-bloco.md"), "utf8").trim();
  return `${INICIO}\n${modelo.replaceAll("{{ONDE}}", comandoOnde(base))}\n${FIM}`;
}

/** Devolve o texto com o bloco trocado, acrescentado ou removido. */
function aplicar(texto, bloco) {
  const i = texto.indexOf(INICIO);
  const f = texto.indexOf(FIM);
  const temBloco = i >= 0 && f > i;
  if (opcoes.remover) {
    if (!temBloco) return texto;
    const antes = texto.slice(0, i).replace(/\n+$/u, "");
    const depois = texto.slice(f + FIM.length).replace(/^\n+/u, "");
    const junto = [antes, depois].filter(Boolean).join("\n\n");
    return junto ? `${junto}\n` : "";
  }
  if (temBloco) return texto.slice(0, i) + bloco + texto.slice(f + FIM.length);
  const corpo = texto.replace(/\n+$/u, "");
  return corpo ? `${corpo}\n\n${bloco}\n` : `${bloco}\n`;
}

/**
 * Procura, fora do bloco, linhas que mandam iniciar agentes por alias de
 * shell. Essas linhas dizem o contrário do bloco, e um agente que lê as duas
 * regras não sabe qual seguir. Devolve os números das linhas, a partir de 1.
 */
function linhasComAlias(texto) {
  const i = texto.indexOf(INICIO);
  const f = texto.indexOf(FIM);
  const fora = i >= 0 && f > i ? texto.slice(0, i) + texto.slice(i, f + FIM.length).replace(/[^\n]/gu, "") + texto.slice(f + FIM.length) : texto;
  const padrao = /zsh -ic\b|`(?:cc|cx|oc)`/u;
  return fora.split("\n").flatMap((linha, n) => (padrao.test(linha) ? [n + 1] : []));
}

/** Aplica o bloco em um arquivo e devolve o que aconteceu. */
function tratar(arquivo, base) {
  const existe = existsSync(arquivo);
  const atual = existe ? readFileSync(arquivo, "utf8") : "";
  const novo = aplicar(atual, montarBloco(base));
  const conflitos = opcoes.remover ? [] : linhasComAlias(novo);
  const extra = conflitos.length > 0 ? { conflitos } : {};
  if (novo === atual) return { arquivo, estado: opcoes.remover ? "sem bloco" : "em dia", ...extra };
  if (opcoes.check) return { arquivo, estado: existe && atual.includes(INICIO) ? "desatualizado" : "sem bloco", pendente: true, ...extra };
  if (opcoes.remover && !existe) return { arquivo, estado: "sem bloco" };
  mkdirSync(dirname(arquivo), { recursive: true });
  writeFileSync(arquivo, novo);
  return { arquivo, estado: opcoes.remover ? "removido" : existe ? "atualizado" : "criado", ...extra };
}

/** Diz se o caminho é um link simbólico. */
function ehLink(caminho) {
  try {
    return lstatSync(caminho).isSymbolicLink();
  } catch {
    return false;
  }
}

/** Trata `AGENTS.md` e `CLAUDE.md` de um projeto, sem repetir o arquivo real. */
function tratarProjeto(pasta) {
  const base = resolve(pasta);
  const agents = join(base, "AGENTS.md");
  const claude = join(base, "CLAUDE.md");
  const resultados = [];
  const vistos = new Set();
  const real = (caminho) => (existsSync(caminho) ? realpathSync(caminho) : caminho);

  // AGENTS.md é a fonte: recebe o bloco mesmo quando ainda não existe.
  const alvoAgents = real(agents);
  vistos.add(alvoAgents);
  resultados.push(tratar(alvoAgents, base));

  if (existsSync(claude) || ehLink(claude)) {
    const alvoClaude = real(claude);
    if (vistos.has(alvoClaude)) resultados.push({ arquivo: claude, estado: "link para AGENTS.md" });
    else resultados.push(tratar(alvoClaude, base));
  } else if (!opcoes.remover) {
    if (opcoes.check) resultados.push({ arquivo: claude, estado: "ausente", pendente: true });
    else {
      try {
        symlinkSync("AGENTS.md", claude);
        resultados.push({ arquivo: claude, estado: "criado como link para AGENTS.md" });
      } catch {
        // Sem permissão para links (Windows sem modo de desenvolvedor, por
        // exemplo): o arquivo recebe o mesmo bloco.
        resultados.push(tratar(claude, base));
      }
    }
  }
  return resultados;
}

/** Trata os arquivos globais das pastas de agente que já existem. */
function tratarGlobal() {
  const casa = homedir();
  const alvos = [
    { pasta: join(casa, ".claude"), arquivo: "CLAUDE.md" },
    { pasta: join(casa, ".codex"), arquivo: "AGENTS.md" },
    { pasta: join(casa, ".config", "opencode"), arquivo: "AGENTS.md" },
  ];
  return alvos.map(({ pasta, arquivo }) => {
    const caminho = join(pasta, arquivo);
    if (!existsSync(pasta)) return { arquivo: caminho, estado: "agente não instalado" };
    return tratar(existsSync(caminho) ? realpathSync(caminho) : caminho, undefined);
  });
}

let resultados = [];
if (opcoes.arquivos.length > 0) resultados = opcoes.arquivos.map((a) => tratar(resolve(a), undefined));
if (opcoes.global) resultados = resultados.concat(tratarGlobal());
if (opcoes.projeto !== undefined || (!opcoes.global && opcoes.arquivos.length === 0)) {
  resultados = resultados.concat(tratarProjeto(opcoes.projeto ?? process.cwd()));
}

const pendentes = resultados.filter((r) => r.pendente).length;
if (opcoes.json) console.log(JSON.stringify({ pendentes, arquivos: resultados.map(({ pendente, ...r }) => r) }, null, 2));
else {
  for (const r of resultados) {
    console.log(`${r.estado}: ${comTil(r.arquivo)}`);
    if (r.conflitos) console.log(`  aviso: regra de alias fora do bloco nas linhas ${r.conflitos.join(", ")}; ela diz o contrário do bloco`);
  }
}
if (opcoes.check && pendentes > 0) process.exitCode = 1;
