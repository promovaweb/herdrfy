#!/usr/bin/env node
/**
 * File: skills/herdrfy/scripts/instructions.mjs
 * Description: Writes, checks or removes the Herdrfy instruction block in the
 * `AGENTS.md` and `CLAUDE.md` files, so every agent opened in the project (or
 * on the machine) knows how to locate itself in Herdr, start agents with the
 * permission flags and open panes in the tab of whoever asked.
 *
 * Usage:
 *   node instructions.mjs                   project in the current folder
 *   node instructions.mjs --project <dir>   another project
 *   node instructions.mjs --global          the agents' global files
 *   node instructions.mjs --file <path>     one specific file (repeatable)
 *   node instructions.mjs --check           only checks; exits 1 if missing
 *   node instructions.mjs --remove          takes the block out
 *   node instructions.mjs --json            answer as JSON
 *   node instructions.mjs --help            this text
 *
 * Project: the block goes into `AGENTS.md` and `CLAUDE.md`. When one is a link
 * to the other, the real file gets the block once. When `CLAUDE.md` does not
 * exist, it is created as a link to `AGENTS.md`; if the system refuses the
 * link, it is created as a file with the same block.
 *
 * Global: `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` and
 * `~/.config/opencode/AGENTS.md`, only in agent folders that already exist.
 *
 * The block sits between the markers `<!-- herdrfy:start -->` and
 * `<!-- herdrfy:end -->`. Running again replaces what is between them and
 * keeps the rest of the file. Blocks written by versions before 0.2.0 used
 * `<!-- herdrfy:inicio -->` and `<!-- herdrfy:fim -->`; they are recognized
 * and rewritten with the current markers. The text comes from
 * `assets/instrucoes-bloco.md`, with `{{WHERE}}` replaced by the locator
 * command of this installation.
 *
 * Conflict warning: when the file, outside the block, tells agents to start
 * through a shell alias (`zsh -ic`, `cc`, `cx`, `oc`), the answer carries
 * `conflicts` with the line numbers. The script does not touch those lines.
 *
 * JSON output: { pending, files: [{ file, state, conflicts? }] }. States:
 * "current", "outdated", "no block", "missing", "created", "updated",
 * "removed", "link to AGENTS.md", "created as link to AGENTS.md",
 * "agent not installed".
 *
 * Exit codes: 0 done or current, 1 `--check` found a file without the current
 * block, 2 invalid argument.
 *
 * Requirements: Node.js 18 or newer.
 */
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const START = "<!-- herdrfy:start -->";
const END = "<!-- herdrfy:end -->";
/** Marker pairs this script recognizes; the first one is the one it writes. */
const MARKERS = [
  [START, END],
  ["<!-- herdrfy:inicio -->", "<!-- herdrfy:fim -->"],
];
const here = dirname(fileURLToPath(import.meta.url));

const USAGE = `Usage: node instructions.mjs [--project <dir> | --global | --file <path>] [--check | --remove] [--json]

Writes, checks or removes the Herdrfy instruction block in AGENTS.md and CLAUDE.md.

  --project <dir>  project folder (default: the current folder)
  --global         the agents' global files, in agent folders that exist
  --file <path>    one specific file; repeatable
  --check          only checks; exits 1 when a file lacks the current block
  --remove         takes the block out
  --json           print the answer as JSON
  -h, --help       show this text

Exit codes: 0 done or current, 1 --check found pending files, 2 invalid argument.`;

/** Prints an argument error with the usage line and exits with 2. */
function fail(message) {
  console.error(`${message}\n${USAGE.split("\n")[0]}`);
  process.exit(2);
}

const args = process.argv.slice(2);
const options = { check: false, remove: false, json: false, global: false, project: undefined, files: [] };
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--help" || arg === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else if (arg === "--check") options.check = true;
  else if (arg === "--remove") options.remove = true;
  else if (arg === "--json") options.json = true;
  else if (arg === "--global") options.global = true;
  else if (arg === "--project") {
    options.project = args[++i];
    if (options.project === undefined) fail("--project needs a folder.");
  } else if (arg === "--file") {
    const file = args[++i];
    if (file === undefined) fail("--file needs a path.");
    options.files.push(file);
  } else fail(`Unknown argument: ${arg}`);
}

/** Writes a path with `~` when it sits inside the home folder. */
function withTilde(path) {
  const home = homedir();
  return path === home || path.startsWith(home + sep) ? `~${path.slice(home.length)}`.split(sep).join("/") : path;
}

/**
 * Builds the locator command as it should appear in the block: a relative
 * path when the skill lives inside the project, a `~` path otherwise, so the
 * block stays valid on other machines with the same home layout.
 */
function whereCommand(base) {
  const where = join(here, "where.mjs");
  if (base) {
    const rel = relative(base, where);
    if (!rel.startsWith("..") && !isAbsolute(rel)) return `node ${rel.split(sep).join("/")}`;
  }
  return `node ${withTilde(where)}`;
}

/** Reads the block template and returns the final text, between the markers. */
function buildBlock(base) {
  const template = readFileSync(join(here, "..", "assets", "instrucoes-bloco.md"), "utf8").trim();
  return `${START}\n${template.replaceAll("{{WHERE}}", whereCommand(base))}\n${END}`;
}

/** Finds the block in a text and returns `{ from, to }`, or `null`. */
function findBlock(text) {
  for (const [start, end] of MARKERS) {
    const from = text.indexOf(start);
    const endAt = text.indexOf(end);
    if (from >= 0 && endAt > from) return { from, to: endAt + end.length };
  }
  return null;
}

/** Returns the text with the block replaced, appended or removed. */
function apply(text, block) {
  const found = findBlock(text);
  if (options.remove) {
    if (!found) return text;
    const before = text.slice(0, found.from).replace(/\n+$/u, "");
    const after = text.slice(found.to).replace(/^\n+/u, "");
    const joined = [before, after].filter(Boolean).join("\n\n");
    return joined ? `${joined}\n` : "";
  }
  if (found) return text.slice(0, found.from) + block + text.slice(found.to);
  const body = text.replace(/\n+$/u, "");
  return body ? `${body}\n\n${block}\n` : `${block}\n`;
}

/**
 * Looks, outside the block, for lines that tell agents to start through a
 * shell alias. Those lines say the opposite of the block, and an agent that
 * reads both rules cannot tell which one to follow. Returns 1-based line
 * numbers.
 */
function aliasLines(text) {
  const found = findBlock(text);
  // Blank the block but keep its newlines, so line numbers stay the same.
  const outside = found ? text.slice(0, found.from) + text.slice(found.from, found.to).replace(/[^\n]/gu, "") + text.slice(found.to) : text;
  const pattern = /zsh -ic\b|`(?:cc|cx|oc)`/u;
  return outside.split("\n").flatMap((line, n) => (pattern.test(line) ? [n + 1] : []));
}

/** Applies the block to one file and reports what happened. */
function handle(file, base) {
  const exists = existsSync(file);
  const current = exists ? readFileSync(file, "utf8") : "";
  const next = apply(current, buildBlock(base));
  const conflicts = options.remove ? [] : aliasLines(next);
  const extra = conflicts.length > 0 ? { conflicts } : {};
  if (next === current) return { file, state: options.remove ? "no block" : "current", ...extra };
  if (options.check) return { file, state: exists && findBlock(current) ? "outdated" : "no block", pending: true, ...extra };
  if (options.remove && !exists) return { file, state: "no block" };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, next);
  return { file, state: options.remove ? "removed" : exists ? "updated" : "created", ...extra };
}

/** Tells whether the path is a symbolic link. */
function isLink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/** Handles a project's `AGENTS.md` and `CLAUDE.md` without repeating the real file. */
function handleProject(dir) {
  const base = resolve(dir);
  const agents = join(base, "AGENTS.md");
  const claude = join(base, "CLAUDE.md");
  const results = [];
  const seen = new Set();
  const real = (path) => (existsSync(path) ? realpathSync(path) : path);

  // AGENTS.md is the source: it gets the block even when it does not exist yet.
  const agentsTarget = real(agents);
  seen.add(agentsTarget);
  results.push(handle(agentsTarget, base));

  if (existsSync(claude) || isLink(claude)) {
    const claudeTarget = real(claude);
    if (seen.has(claudeTarget)) results.push({ file: claude, state: "link to AGENTS.md" });
    else results.push(handle(claudeTarget, base));
  } else if (!options.remove) {
    if (options.check) results.push({ file: claude, state: "missing", pending: true });
    else {
      try {
        symlinkSync("AGENTS.md", claude);
        results.push({ file: claude, state: "created as link to AGENTS.md" });
      } catch {
        // No permission for links (Windows without developer mode, for
        // example): the file gets the same block.
        results.push(handle(claude, base));
      }
    }
  }
  return results;
}

/** Handles the global files of the agent folders that already exist. */
function handleGlobal() {
  const home = homedir();
  const targets = [
    { dir: join(home, ".claude"), name: "CLAUDE.md" },
    { dir: join(home, ".codex"), name: "AGENTS.md" },
    { dir: join(home, ".config", "opencode"), name: "AGENTS.md" },
  ];
  return targets.map(({ dir, name }) => {
    const path = join(dir, name);
    if (!existsSync(dir)) return { file: path, state: "agent not installed" };
    return handle(existsSync(path) ? realpathSync(path) : path, undefined);
  });
}

let results = [];
if (options.files.length > 0) results = options.files.map((f) => handle(resolve(f), undefined));
if (options.global) results = results.concat(handleGlobal());
if (options.project !== undefined || (!options.global && options.files.length === 0)) {
  results = results.concat(handleProject(options.project ?? process.cwd()));
}

const pending = results.filter((r) => r.pending).length;
if (options.json) console.log(JSON.stringify({ pending, files: results.map(({ pending: _pending, ...r }) => r) }, null, 2));
else {
  for (const r of results) {
    console.log(`${r.state}: ${withTilde(r.file)}`);
    if (r.conflicts) console.log(`  warning: alias rule outside the block on lines ${r.conflicts.join(", ")}; it says the opposite of the block`);
  }
}
if (options.check && pending > 0) process.exitCode = 1;
