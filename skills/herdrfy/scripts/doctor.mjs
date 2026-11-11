#!/usr/bin/env node
/**
 * File: skills/herdrfy/scripts/doctor.mjs
 * Description: Shows the state of the Herdr installation on this machine
 * without changing anything: binaries and versions, servers, TUI
 * integrations, skills, herdr-core templates, coding agents and configuration
 * files. The skill reads the answer to know what is left to set up.
 *
 * Usage:
 *   node doctor.mjs          readable text
 *   node doctor.mjs --json   JSON object
 *   node doctor.mjs --help   this text
 *
 * JSON output: { environment, binaries, servers, integrations, skills,
 * templates, agents, config, pending }. `pending` lists, as text, each missing
 * item with the command that fixes it.
 *
 * Exit codes: 0 whenever the check ran (missing items show up in `pending`,
 * not in the exit code), 2 invalid argument.
 *
 * Requirements: Node.js 18 or newer.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

const USAGE = `Usage: node doctor.mjs [--json]

Shows the state of the Herdr installation on this machine. Read-only.

  --json      print the answer as JSON
  -h, --help  show this text

Exit codes: 0 the check ran, 2 invalid argument.`;

let json = false;
for (const arg of process.argv.slice(2)) {
  if (arg === "--help" || arg === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else if (arg === "--json") json = true;
  else {
    console.error(`Unknown argument: ${arg}\n${USAGE.split("\n")[0]}`);
    process.exit(2);
  }
}

const home = homedir();
const configHome = process.env.XDG_CONFIG_HOME || join(home, ".config");

/** Runs a command and returns its output, or `undefined` when it fails. */
function attempt(command, commandArgs) {
  try {
    return execFileSync(command, commandArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000 }).trim();
  } catch {
    return undefined;
  }
}

/** Returns the path of an executable on PATH, or `null`. */
function pathOf(command) {
  const extensions = process.platform === "win32" ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of (process.env.PATH ?? "").split(delimiter).filter(Boolean)) {
    for (const ext of extensions) {
      const candidate = join(dir, command + ext);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/** Builds `{ path, version }` for an executable. */
function binary(command, versionArg = "--version") {
  const path = pathOf(command);
  if (!path) return { path: null, version: null };
  const version = attempt(command, [versionArg]);
  return { path, version: version ? version.split("\n")[0] : null };
}

/** Lists the entries of a folder, or nothing when it does not exist. */
function list(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

const binaries = {
  herdr: binary("herdr"),
  hc: binary("hc"),
  "herdr-app": binary("herdr-app"),
  node: binary("node"),
};

const servers = { tui: null, core: null };
if (binaries.herdr.path) {
  const status = attempt("herdr", ["status"]);
  servers.tui = status ? (/status:\s*running/u.test(status) ? "running" : "stopped") : "no answer";
}
if (binaries.hc.path) {
  // `hc server status` does not start a core; it only reports what runs.
  const status = attempt("hc", ["server", "status", "--json"]);
  try {
    const data = JSON.parse(status ?? "");
    servers.core = data.pid ? `running (${data.live ?? 0} live terminals)` : "stopped";
  } catch {
    servers.core = "no answer";
  }
}

// TUI integrations: lines shaped like "claude: current (v11) (/path)".
const integrations = {};
if (binaries.herdr.path) {
  const output = attempt("herdr", ["integration", "status"]) ?? "";
  for (const line of output.split("\n")) {
    const match = /^([a-z-]+)(?: \([a-z]+\))?: (current|outdated|not installed)/u.exec(line);
    if (match) integrations[match[1]] = match[2];
  }
}

// Skills: looks in the global folders and in the current project.
const skillDirs = [
  join(home, ".agents", "skills"),
  join(home, ".claude", "skills"),
  join(home, ".codex", "skills"),
  join(configHome, "opencode", "skills"),
  join(process.cwd(), ".agents", "skills"),
  join(process.cwd(), ".claude", "skills"),
];
const skills = {};
for (const name of ["herdrfy", "herdr", "herdr-core"]) {
  skills[name] = skillDirs.filter((dir) => existsSync(join(dir, name, "SKILL.md")));
}

const templateDir = join(configHome, "herdr-core", "templates");
const templates = list(templateDir).filter((n) => n.endsWith(".md")).map((n) => n.slice(0, -3));

const agents = {
  claude: binary("claude"),
  codex: binary("codex"),
  opencode: binary("opencode"),
};

/** Builds `{ file, exists }` for a configuration file. */
function configFile(file) {
  return { file, exists: existsSync(file) };
}

const config = {
  tui: configFile(join(configHome, "herdr", "config.toml")),
  core: configFile(join(configHome, "herdr-core", "config.toml")),
  desktop: configFile(join(process.env.HERDR_APP_HOME || join(configHome, "herdr-app"), "AGENTS.md")),
};

const environment = {
  HC_TERMINAL_ID: process.env.HC_TERMINAL_ID ?? null,
  HERDR_ENV: process.env.HERDR_ENV ?? null,
  HERDR_PANE_ID: process.env.HERDR_PANE_ID ?? null,
};

const pending = [];
if (!binaries.herdr.path && !binaries.hc.path) pending.push("No Herdr installed. TUI: curl -fsSL https://herdr.dev/install.sh | sh. Desktop: curl -fsSL https://releases.herdr.dev/app/install.sh | sh.");
if (binaries.herdr.path && skills.herdr.length === 0) pending.push("Skill herdr missing: npx skills add herdrdev/herdr --skill herdr -g");
if (binaries.hc.path && skills["herdr-core"].length === 0) pending.push("Skill herdr-core missing: npx skills add herdrdev/herdr-core --skill herdr-core -g");
if (binaries.herdr.path) {
  for (const agent of Object.keys(agents)) {
    if (!agents[agent].path) continue;
    if (integrations[agent] === "not installed") pending.push(`TUI integration missing for ${agent}: herdr integration install ${agent}`);
    if (integrations[agent] === "outdated") pending.push(`TUI integration outdated for ${agent}: herdr integration install ${agent}`);
  }
}
if (binaries.hc.path) {
  for (const name of ["claude-yolo", "codex-yolo", "opencode-yolo"]) {
    const agent = name.split("-")[0];
    if (agents[agent].path && !templates.includes(name)) pending.push(`Template ${name} missing in ${templateDir}: copy it from assets/templates/${name}.md`);
  }
}
for (const agent of Object.keys(agents)) {
  if (!agents[agent].path) pending.push(`Agent ${agent} is not on this machine's PATH.`);
}

const data = { environment, binaries, servers, integrations, skills, templates: { dir: templateDir, names: templates }, agents, config, pending };

if (json) {
  console.log(JSON.stringify(data, null, 2));
} else {
  const row = (label, value) => console.log(`${label.padEnd(22)}${value}`);
  console.log("Binaries");
  for (const [name, b] of Object.entries(binaries)) row(`  ${name}`, b.path ? `${b.version ?? "unknown version"} (${b.path})` : "missing");
  console.log("Servers");
  row("  Herdr TUI", servers.tui ?? "no binary");
  row("  herdr-core", servers.core ?? "no binary");
  console.log("Environment of this process");
  for (const [name, value] of Object.entries(environment)) row(`  ${name}`, value ?? "empty");
  console.log("Coding agents");
  for (const [name, b] of Object.entries(agents)) row(`  ${name}`, b.path ? `${b.version ?? "unknown version"}${integrations[name] ? `, TUI integration ${integrations[name]}` : ""}` : "missing");
  console.log("Skills");
  for (const [name, dirs] of Object.entries(skills)) row(`  ${name}`, dirs.length > 0 ? dirs.join(", ") : "missing");
  console.log("herdr-core templates");
  row("  folder", templateDir);
  row("  names", templates.length > 0 ? templates.join(", ") : "none");
  console.log("Configuration");
  for (const [name, c] of Object.entries(config)) row(`  ${name}`, `${c.file}${c.exists ? "" : " (does not exist)"}`);
  console.log(pending.length > 0 ? "Pending" : "Pending: none");
  for (const p of pending) console.log(`  - ${p}`);
}
