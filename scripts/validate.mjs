#!/usr/bin/env node
/**
 * File: scripts/validate.mjs
 * Description: Validates the Herdrfy repository before a commit or release.
 *
 * Checks:
 *   1. Every folder in `skills/` has a `SKILL.md` whose frontmatter `name`
 *      equals the folder name and whose `description` has at most 1024
 *      characters, plus at least one file in `references/`.
 *   2. Every relative link in the repository's Markdown points to a file that
 *      exists.
 *   3. The skill's instruction text (SKILL.md, references and assets) uses
 *      neither the em dash nor the word families Promovaweb vetoes.
 *   4. The agents' full commands appear identical in the reference, in the
 *      instruction block and in the templates.
 *   5. The version in `package.json` is the first entry of `CHANGELOG.md`.
 *   6. The scripts pass `node --check`.
 *   7. No Markdown outside the changelog still names a script, flag or marker
 *      from before 0.2.0.
 *
 * Usage: `npm run validate`. Exits 1 and lists the problems on failure.
 * Requirements: Node.js 18 or newer, no external packages.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const fail = (file, message) => problems.push(`${relative(root, file) || "."}: ${message}`);

/** Lists the files of a folder recursively, skipping hidden folders and node_modules. */
function list(dir, filter) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    if (item.name.startsWith(".") || item.name === "node_modules") return [];
    const path = join(dir, item.name);
    if (item.isDirectory()) return list(path, filter);
    return filter(item.name) ? [path] : [];
  });
}

// 1. Skill structure.
const skillsDir = join(root, "skills");
const skills = readdirSync(skillsDir, { withFileTypes: true }).filter((i) => i.isDirectory()).map((i) => i.name);
if (skills.length === 0) fail(skillsDir, "no skill found");
for (const name of skills) {
  const file = join(skillsDir, name, "SKILL.md");
  if (!existsSync(file)) {
    fail(file, "SKILL.md missing");
    continue;
  }
  const text = readFileSync(file, "utf8");
  const header = /^---\n([\s\S]*?)\n---\n/u.exec(text);
  if (!header) {
    fail(file, "frontmatter missing");
    continue;
  }
  const field = (key) => new RegExp(`^${key}:\\s*(.+)$`, "mu").exec(header[1])?.[1]?.trim();
  if (field("name") !== name) fail(file, `name must be "${name}"`);
  const description = field("description");
  if (!description) fail(file, "description missing");
  else if (description.length > 1024) fail(file, `description has ${description.length} characters (limit 1024)`);
  if (list(join(skillsDir, name, "references"), (n) => n.endsWith(".md")).length === 0) fail(file, "no files in references/");
}

// 2. Relative links.
const markdowns = list(root, (n) => n.endsWith(".md"));
for (const file of markdowns) {
  // Code blocks hold no links to check.
  const text = readFileSync(file, "utf8").replace(/```[\s\S]*?```/gu, "");
  for (const match of text.matchAll(/\]\(([^)\s]+)\)/gu)) {
    const target = match[1].split("#")[0];
    if (!target || /^[a-z]+:/iu.test(target)) continue;
    if (!existsSync(resolve(dirname(file), target))) fail(file, `broken link: ${match[1]}`);
  }
}

// 3. Instruction text without the em dash and the vetoed word families.
// The patterns match Portuguese words because the skill text is Portuguese.
const vetoed = [
  { name: "em dash", regex: /—/gu },
  { name: "risco", regex: /\brisco[a-z]*\b/giu },
  { name: "decisão", regex: /\bdecis[aã]o\b|\bdecis[oõ]es\b/giu },
  { name: "evidência", regex: /\bevid[eê]ncias?\b/giu },
  { name: "critério", regex: /\bcrit[eé]rio(s|so|sa|sos|sas|samente)?\b/giu },
  { name: "inventário", regex: /\binvent[aá]ri[oa][sr]?\b|\binvent[aá]riando\b/giu },
  { name: "atrito", regex: /\batritos?\b/giu },
  { name: "bloqueio", regex: /\bbloque(io|ios|ar|ia|iam|ou|ado|ada|ados|adas|ando)\b/giu },
  { name: "em que", regex: /\bem que\b/giu },
];
for (const file of list(skillsDir, (n) => n.endsWith(".md"))) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const { name, regex } of vetoed) {
      regex.lastIndex = 0;
      if (regex.test(line)) fail(file, `line ${i + 1}: vetoed term (${name})`);
    }
  });
}

// 4. The agents' full commands, identical everywhere.
const commands = {
  claude: "claude --permission-mode=auto --dangerously-skip-permissions",
  codex: "codex --yolo --no-daemon",
  opencode: "opencode --auto",
};
const skill = join(skillsDir, "herdrfy");
const places = [join(skill, "references", "agentes.md"), join(skill, "assets", "instrucoes-bloco.md"), join(skill, "references", "configuracao.md")];
for (const file of places) {
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  for (const [agent, command] of Object.entries(commands)) {
    if (!text.includes(command)) fail(file, `full command for ${agent} missing: ${command}`);
  }
}
for (const [agent, command] of Object.entries(commands)) {
  const file = join(skill, "assets", "templates", `${agent}-yolo.md`);
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  if (!text.includes(`\ncommand: ${command}\n`)) fail(file, `command must be "${command}"`);
}

// 5. Version and changelog.
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const first = /^## \[(\d+\.\d+\.\d+)\]/mu.exec(readFileSync(join(root, "CHANGELOG.md"), "utf8"))?.[1];
if (first !== version) fail(join(root, "CHANGELOG.md"), `first entry is ${first ?? "missing"}, package.json says ${version}`);

// 6. Script syntax.
for (const file of [...list(join(skill, "scripts"), (n) => n.endsWith(".mjs")), ...list(join(root, "scripts"), (n) => n.endsWith(".mjs"))]) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    fail(file, `syntax error: ${String(error.stderr ?? error.message).split("\n")[0]}`);
  }
  if (!statSync(file).isFile()) fail(file, "not a file");
}

// 7. Names from before 0.2.0. The changelog keeps them as history.
const retired = /onde\.mjs|diagnostico\.mjs|instrucoes\.mjs|validar\.mjs|--superficie|--projeto|--arquivo|--remover|\{\{ONDE\}\}/u;
for (const file of markdowns) {
  if (relative(root, file) === "CHANGELOG.md") continue;
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    const match = retired.exec(line);
    if (match) fail(file, `line ${i + 1}: retired name (${match[0]})`);
  });
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`OK: ${skills.length} skill(s), ${markdowns.length} Markdown files, version ${version}.`);
