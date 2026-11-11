#!/usr/bin/env node
/**
 * Arquivo: scripts/validar.mjs
 * Descrição: Valida o repositório do Herdrfy antes de um commit ou release.
 *
 * Conferências:
 *   1. Cada pasta em `skills/` tem `SKILL.md` com frontmatter `name` igual ao
 *      nome da pasta e `description` de até 1024 caracteres, mais ao menos
 *      uma referência em `references/`.
 *   2. Todo link relativo dos Markdown do repositório aponta para um arquivo
 *      que existe.
 *   3. O texto de instrução das skills (SKILL.md, references e assets) não
 *      usa travessão nem as famílias de palavras vetadas pela Promovaweb.
 *   4. Os comandos completos dos agentes aparecem iguais na referência, no
 *      bloco de instruções e nos templates.
 *   5. A versão de `package.json` é a primeira entrada do `CHANGELOG.md`.
 *   6. Os scripts da skill passam em `node --check`.
 *
 * Uso: `npm run validate`. Sai com 1 e lista os problemas quando há falha.
 * Dependências: Node.js 18 ou mais novo, sem pacotes externos.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const falha = (arquivo, mensagem) => problemas.push(`${relative(raiz, arquivo) || "."}: ${mensagem}`);

/** Lista arquivos de uma pasta, de forma recursiva, ignorando pastas ocultas e node_modules. */
function listar(pasta, filtro) {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    if (item.name.startsWith(".") || item.name === "node_modules") return [];
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) return listar(caminho, filtro);
    return filtro(item.name) ? [caminho] : [];
  });
}

// 1. Estrutura das skills.
const pastaSkills = join(raiz, "skills");
const skills = readdirSync(pastaSkills, { withFileTypes: true }).filter((i) => i.isDirectory()).map((i) => i.name);
if (skills.length === 0) falha(pastaSkills, "nenhuma skill encontrada");
for (const nome of skills) {
  const arquivo = join(pastaSkills, nome, "SKILL.md");
  if (!existsSync(arquivo)) {
    falha(arquivo, "SKILL.md ausente");
    continue;
  }
  const texto = readFileSync(arquivo, "utf8");
  const cabecalho = /^---\n([\s\S]*?)\n---\n/u.exec(texto);
  if (!cabecalho) {
    falha(arquivo, "frontmatter ausente");
    continue;
  }
  const campo = (chave) => new RegExp(`^${chave}:\\s*(.+)$`, "mu").exec(cabecalho[1])?.[1]?.trim();
  if (campo("name") !== nome) falha(arquivo, `name deve ser "${nome}"`);
  const descricao = campo("description");
  if (!descricao) falha(arquivo, "description ausente");
  else if (descricao.length > 1024) falha(arquivo, `description com ${descricao.length} caracteres (limite 1024)`);
  if (listar(join(pastaSkills, nome, "references"), (n) => n.endsWith(".md")).length === 0) falha(arquivo, "sem arquivos em references/");
}

// 2. Links relativos.
const markdowns = listar(raiz, (n) => n.endsWith(".md"));
for (const arquivo of markdowns) {
  // Blocos de código não contêm links a conferir.
  const texto = readFileSync(arquivo, "utf8").replace(/```[\s\S]*?```/gu, "");
  for (const achado of texto.matchAll(/\]\(([^)\s]+)\)/gu)) {
    const alvo = achado[1].split("#")[0];
    if (!alvo || /^[a-z]+:/iu.test(alvo)) continue;
    if (!existsSync(resolve(dirname(arquivo), alvo))) falha(arquivo, `link quebrado: ${achado[1]}`);
  }
}

// 3. Texto de instrução sem travessão e sem as famílias vetadas.
const vetados = [
  { nome: "travessão", regex: /—/gu },
  { nome: "risco", regex: /\brisco[a-z]*\b/giu },
  { nome: "decisão", regex: /\bdecis[aã]o\b|\bdecis[oõ]es\b/giu },
  { nome: "evidência", regex: /\bevid[eê]ncias?\b/giu },
  { nome: "critério", regex: /\bcrit[eé]rio(s|so|sa|sos|sas|samente)?\b/giu },
  { nome: "inventário", regex: /\binvent[aá]ri[oa][sr]?\b|\binvent[aá]riando\b/giu },
  { nome: "atrito", regex: /\batritos?\b/giu },
  { nome: "bloqueio", regex: /\bbloque(io|ios|ar|ia|iam|ou|ado|ada|ados|adas|ando)\b/giu },
  { nome: "em que", regex: /\bem que\b/giu },
];
for (const arquivo of listar(pastaSkills, (n) => n.endsWith(".md"))) {
  const linhas = readFileSync(arquivo, "utf8").split("\n");
  linhas.forEach((linha, i) => {
    for (const { nome, regex } of vetados) {
      regex.lastIndex = 0;
      if (regex.test(linha)) falha(arquivo, `linha ${i + 1}: termo vetado (${nome})`);
    }
  });
}

// 4. Comandos completos dos agentes, iguais em todos os lugares.
const comandos = {
  claude: "claude --permission-mode=auto --dangerously-skip-permissions",
  codex: "codex --yolo --no-daemon",
  opencode: "opencode --auto",
};
const skill = join(pastaSkills, "herdrfy");
const lugares = [join(skill, "references", "agentes.md"), join(skill, "assets", "instrucoes-bloco.md"), join(skill, "references", "configuracao.md")];
for (const arquivo of lugares) {
  const texto = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "";
  for (const [agente, comando] of Object.entries(comandos)) {
    if (!texto.includes(comando)) falha(arquivo, `comando completo do ${agente} ausente: ${comando}`);
  }
}
for (const [agente, comando] of Object.entries(comandos)) {
  const arquivo = join(skill, "assets", "templates", `${agente}-yolo.md`);
  const texto = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "";
  if (!texto.includes(`\ncommand: ${comando}\n`)) falha(arquivo, `command deve ser "${comando}"`);
}

// 5. Versão e changelog.
const versao = JSON.parse(readFileSync(join(raiz, "package.json"), "utf8")).version;
const primeira = /^## \[(\d+\.\d+\.\d+)\]/mu.exec(readFileSync(join(raiz, "CHANGELOG.md"), "utf8"))?.[1];
if (primeira !== versao) falha(join(raiz, "CHANGELOG.md"), `primeira entrada é ${primeira ?? "ausente"}, package.json diz ${versao}`);

// 6. Sintaxe dos scripts.
for (const arquivo of [...listar(join(skill, "scripts"), (n) => n.endsWith(".mjs")), ...listar(join(raiz, "scripts"), (n) => n.endsWith(".mjs"))]) {
  try {
    execFileSync(process.execPath, ["--check", arquivo], { stdio: "pipe" });
  } catch (erro) {
    falha(arquivo, `erro de sintaxe: ${String(erro.stderr ?? erro.message).split("\n")[0]}`);
  }
  if (!statSync(arquivo).isFile()) falha(arquivo, "não é um arquivo");
}

if (problemas.length > 0) {
  console.error(`${problemas.length} problema(s):`);
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`OK: ${skills.length} skill(s), ${markdowns.length} arquivos Markdown, versão ${versao}.`);
