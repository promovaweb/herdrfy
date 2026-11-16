#!/usr/bin/env node
/**
 * File: skills/herdrfy/scripts/where.mjs
 * Description: Reports where the current agent runs inside Herdr, on one of
 * the two surfaces: Desktop (herdr-core terminals, `hc` CLI) or TUI (Herdr
 * panes, `herdr` CLI).
 *
 * Usage:
 *   node where.mjs                     detect the surface
 *   node where.mjs --surface desktop   use the surface the person named
 *   node where.mjs --surface tui
 *   node where.mjs --json              same answer as JSON
 *   node where.mjs --help              this text
 *
 * `--surface` also accepts `core` and `hc` for desktop, and `herdr` for tui.
 *
 * Detection without `--surface`: the process tree comes first. The script
 * walks up from this process and takes the nearest ancestor: a process named
 * `herdr-core` means desktop, a process named `herdr` means tui. Only when no
 * such ancestor exists (or there is no `/proc`, as on macOS and Windows) it
 * reads the variables: `TERM_PROGRAM=herdr` means tui (Herdr TUI 0.9.2 and
 * newer set it in each pane; herdr-core overwrites it in its terminals); then
 * `HC_TERMINAL_ID` means desktop and wins over `HERDR_ENV=1`, which means
 * tui. Core terminals often inherit `HERDR_ENV=1`
 * and stale IDs from a Herdr TUI that ran before on the same machine, and a
 * TUI started inside a core terminal inherits `HC_TERMINAL_ID`.
 *
 * Test variables: `HERDRFY_PROC_ROOT` replaces `/proc` and `HERDRFY_PID`
 * replaces `process.pid` as the first pid of the walk, so the tests can build
 * a fake process tree.
 *
 * Desktop placement: a terminal sits in a window tab only when it carries both
 * `herdr.space` and `herdr.tab` labels. `terminal.placement` says which case
 * applies:
 *   "tab"       both labels present; new panes repeat them
 *   "unlabeled" a `where` label exists but the tab labels do not (seen on
 *               terminals created by a client other than the window); there is
 *               no tab to repeat
 *   "none"      no placement labels at all; the terminal is outside the window
 *
 * On the TUI, `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID` and `HERDR_PANE_ID` go
 * stale when the pane is moved. The script walks up the process tree to the
 * Herdr server, takes its direct child shell and looks for the pane whose
 * `shell_pid` is that shell. Without `/proc`, it falls back to the variables
 * and says so.
 *
 * JSON output:
 *   Desktop: { surface: "desktop", found, cli: "hc", window: { cli,
 *     available }, terminal: { id, name, where, space, tab, placement,
 *     identity, cwd, program, state, status, parent }, neighbors: [...],
 *     ...common }
 *   TUI: { surface: "tui", found, cli: "herdr", workspace, tab: { id, label,
 *     panes }, pane: { id, cwd, agent, size: { width, height } | null },
 *     neighbors: [{ id, agent, status, cwd }], envCurrent, method,
 *     workspaces: [...], ...common }
 *   Command missing: { surface, found: false, missing: "hc" | "herdr",
 *     install: [...], ...common }
 *   Outside Herdr: { surface: null, found: false, install?: [...], ...common }
 *
 * Common keys:
 *   installed   { herdr, hc, herdrApp }: which binaries are on PATH
 *   install     [{ product: "tui" | "desktop" | "core", command }]: official
 *               install commands for this platform; only when the needed
 *               command is missing (or no Herdr binary exists at all)
 *   agent       { name, source: "process" | "herdr" | "env" | null, pid,
 *               permissions }: the coding agent this script runs under, from
 *               the nearest known agent in the process tree, then the program
 *               Herdr reports, then CLAUDECODE=1; `permissions` tells whether
 *               its command line carries the flag that skips approvals
 *   preference  { open: "auto" | "pane" | "tab", file, exists, error? }: read
 *               from HERDRFY_CONFIG or $XDG_CONFIG_HOME/herdrfy/config.json
 *               (~/.config/herdrfy/config.json)
 *   advice      { open: "pane" | "tab" | "auxiliary" | null, direction:
 *               "right" | "down" | null, reason, source: "preference" |
 *               "layout" | "placement" }: where the next terminal should open
 *               when the person did not say. TUI: split while both halves keep
 *               80 columns or 20 rows and the tab has fewer than 4 panes, else
 *               a new tab. Desktop: pane while the tab shows fewer than 3
 *               terminals, else a new tab; auxiliary without tab labels.
 *   detection, mismatch?: see below
 *
 * The `detection` object appears in every answer:
 *   process       surface given by the process tree: "desktop", "tui" or null
 *   env           surface the variables alone would give: "desktop", "tui" or
 *                 null
 *   termProgram   value of TERM_PROGRAM, or null: "herdr" in a TUI pane, the
 *                 core's terminal identity (such as "ghostty") in a core
 *                 terminal
 *   inheritedEnv  variables of the other surface found in the environment:
 *                 HERDR_ENV, HERDR_SOCKET_PATH, HERDR_PANE_ID,
 *                 HERDR_WORKSPACE_ID and HERDR_TAB_ID in a core terminal,
 *                 HC_TERMINAL_ID and HC_TERMINAL_SOCKET in a TUI pane; measured against the
 *                 surface the process tree gives (the chosen surface when
 *                 the tree gives none); empty when there is none
 * `mismatch: true` appears only when `--surface` contradicts
 * `detection.process`; the answer keeps the surface the person asked for, and
 * the text output opens with a `Warning:` line saying the commands do not
 * reach where this agent runs.
 *
 * Exit codes: 0 answered (also outside Herdr), 1 could not read Herdr,
 * 2 invalid argument.
 *
 * Requirements: Node.js 18 or newer; `hc` or `herdr` on PATH.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, join } from "node:path";

/** Root of the process table; `HERDRFY_PROC_ROOT` lets the tests replace it. */
const PROC_ROOT = process.env.HERDRFY_PROC_ROOT || "/proc";

/** First pid of the walk; `HERDRFY_PID` lets the tests start from a fake one. */
const START_PID = Number(process.env.HERDRFY_PID ?? process.pid);

/** Process names that mark a surface, one per ancestor kind. */
const SURFACE_BY_PROCESS = { "herdr-core": "desktop", herdr: "tui" };

/** Position variables of a Herdr TUI, in the order the answer lists them. */
// HERDR_SOCKET_PATH is the one that routes the `herdr` CLI to the TUI server.
const TUI_VARIABLES = ["HERDR_ENV", "HERDR_SOCKET_PATH", "HERDR_PANE_ID", "HERDR_WORKSPACE_ID", "HERDR_TAB_ID"];

/**
 * Coding agents recognized in the process tree, each with the command-line
 * flags that skip approvals (empty when not checked for that agent).
 */
const KNOWN_AGENTS = {
  claude: ["--dangerously-skip-permissions"],
  codex: ["--yolo", "--dangerously-bypass-approvals-and-sandbox"],
  opencode: ["--auto"],
  gemini: ["--yolo"],
  copilot: ["--allow-all"],
  kimi: ["--auto"],
  hermes: ["--yolo"],
  goose: [],
  omp: [],
  "cursor-agent": [],
};

/** Smallest pane that keeps an agent readable, in columns and rows. */
const MIN_COLS = 80;
const MIN_ROWS = 20;

/** A tab with this many panes (TUI) or terminals (Desktop) gets a new tab instead. */
const TUI_MAX_PANES = 4;
const DESKTOP_MAX_PANES = 3;

/** Official install commands, from the install pages of each product. */
const INSTALL = {
  linux: [
    { product: "tui", command: "curl -fsSL https://herdr.dev/install.sh | sh" },
    { product: "desktop", command: "curl -fsSL https://releases.herdr.dev/app/install.sh | sh" },
    { product: "core", command: "curl -fsSL https://releases.herdr.dev/core/install.sh | sh" },
  ],
  darwin: [
    { product: "tui", command: "curl -fsSL https://herdr.dev/install.sh | sh" },
    { product: "tui", command: "brew install herdr" },
    { product: "desktop", command: "curl -fsSL https://releases.herdr.dev/app/install.sh | sh" },
    { product: "desktop", command: "brew install --cask herdr-app" },
    { product: "core", command: "curl -fsSL https://releases.herdr.dev/core/install.sh | sh" },
  ],
  win32: [
    { product: "tui", command: 'powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 | iex"' },
    { product: "desktop", command: "irm https://releases.herdr.dev/app/install.ps1 | iex" },
    { product: "core", command: 'powershell -c "irm https://releases.herdr.dev/core/install.ps1 | iex"' },
  ],
};

const USAGE = `Usage: node where.mjs [--surface desktop|tui] [--json]

Reports where this agent runs inside Herdr.

  --surface <name>  surface named by the person: desktop (also core, hc) or tui (also herdr)
  --json            print the answer as JSON
  -h, --help        show this text

Exit codes: 0 answered, 1 could not read Herdr, 2 invalid argument.`;

/** Parses the command line; exits with 2 on anything it does not know. */
function parseArgs(argv) {
  const options = { json: false, surface: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else if (arg === "--json") options.json = true;
    else if (arg === "--surface") options.surface = normalizeSurface(argv[++i]);
    else if (arg.startsWith("--surface=")) options.surface = normalizeSurface(arg.slice("--surface=".length));
    else fail(`Unknown argument: ${arg}`);
  }
  return options;
}

/** Prints an argument error with the usage line and exits with 2. */
function fail(message) {
  console.error(`${message}\n${USAGE.split("\n")[0]}`);
  process.exit(2);
}

/** Maps the accepted surface names to "desktop" or "tui". */
function normalizeSurface(value) {
  const name = (value ?? "").toLowerCase();
  if (name === "desktop" || name === "core" || name === "hc") return "desktop";
  if (name === "tui" || name === "herdr") return "tui";
  return fail(value ? `Invalid surface: ${value}. Use desktop or tui.` : "--surface needs a value: desktop or tui.");
}

/** Runs a command and returns its standard output. */
function run(command, commandArgs) {
  return execFileSync(command, commandArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** Tells whether an executable exists on PATH, without spawning a process. */
function onPath(command) {
  const extensions = process.platform === "win32" ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";") : [""];
  return (process.env.PATH ?? "")
    .split(delimiter)
    .filter(Boolean)
    .some((dir) => extensions.some((ext) => existsSync(join(dir, command + ext))));
}

/** Runs a Herdr TUI command and returns the `result` of its JSON. */
function herdr(...commandArgs) {
  return JSON.parse(run("herdr", commandArgs)).result;
}

/** Summarizes a herdr-core terminal in the output format. */
function summarizeTerminal(t) {
  const where = t.labels?.where ?? t.where ?? null;
  const space = t.labels?.["herdr.space"] ?? null;
  const tab = t.labels?.["herdr.tab"] ?? null;
  return {
    id: t.address,
    name: t.name ?? null,
    where,
    space,
    tab,
    placement: space && tab ? "tab" : where ? "unlabeled" : "none",
    identity: t.identity ?? null,
    cwd: t.foreground?.cwd ?? t.cwd ?? null,
    program: t.status?.app ?? t.foreground?.name ?? t.agent ?? null,
    state: t.state ?? null,
    status: typeof t.status === "string" ? t.status : (t.status?.state ?? null),
    parent: t.parent ?? null,
  };
}

/** Locates the terminal in herdr-core and lists the neighbors in the same tab. */
function locateOnDesktop() {
  const id = process.env.HC_TERMINAL_ID;
  const window = { cli: "herdr-app", available: onPath("herdr-app") };
  if (!id) {
    // The person said Desktop, but this process is not a core terminal.
    // Addresses still work: the list shows the live terminals.
    const live = JSON.parse(run("hc", ["ls", "--json"])).terminals ?? [];
    return { surface: "desktop", found: false, cli: "hc", window, terminal: null, neighbors: live.map(summarizeTerminal) };
  }
  const terminal = summarizeTerminal(JSON.parse(run("hc", ["get", id, "--json"])));
  let neighbors = [];
  if (terminal.tab) {
    const inTab = JSON.parse(run("hc", ["ls", "--json", "--label", `herdr.tab=${terminal.tab}`])).terminals ?? [];
    neighbors = inTab.filter((t) => t.address !== terminal.id).map(summarizeTerminal);
  }
  return { surface: "desktop", found: true, cli: "hc", window, terminal, neighbors };
}

/** Reads the name and parent PID of a process from the process table. */
function readProcess(pid) {
  try {
    const stat = readFileSync(join(PROC_ROOT, String(pid), "stat"), "utf8");
    // The name sits between parentheses and may contain spaces; PPID follows.
    const end = stat.lastIndexOf(")");
    const name = stat.slice(stat.indexOf("(") + 1, end);
    const ppid = Number(stat.slice(end + 2).split(" ")[1]);
    return { pid, name, ppid };
  } catch {
    return undefined;
  }
}

/**
 * Walks up from this process and returns the surface of the nearest ancestor:
 * `herdr-core` means desktop, `herdr` means tui, anything else continues up.
 * Returns null when the tree has neither, or when the process table is
 * unreadable (macOS, Windows).
 */
function processSurface() {
  let current = readProcess(START_PID);
  while (current && current.ppid > 1) {
    const parent = readProcess(current.ppid);
    if (!parent) return null;
    if (SURFACE_BY_PROCESS[parent.name]) return SURFACE_BY_PROCESS[parent.name];
    current = parent;
  }
  return null;
}

/**
 * Returns the surface the environment variables alone indicate.
 * `TERM_PROGRAM=herdr` comes first: Herdr TUI 0.9.2 and newer set it in every
 * pane, and herdr-core replaces it with its own identity in its terminals, so
 * it names the nearest host even when the other surface's variables leaked in.
 */
function envSurface() {
  if (process.env.TERM_PROGRAM === "herdr") return "tui";
  if (process.env.HC_TERMINAL_ID) return "desktop";
  if (process.env.HERDR_ENV === "1") return "tui";
  return null;
}

/**
 * Lists the variables of the other surface present in the environment: the
 * TUI position variables in a core terminal, `HC_TERMINAL_ID` in a TUI pane.
 */
function inheritedEnv(surface) {
  if (surface === "desktop") return TUI_VARIABLES.filter((name) => process.env[name]);
  // HC_TERMINAL_SOCKET is the one that routes the `hc` CLI to the core.
  if (surface === "tui") return ["HC_TERMINAL_ID", "HC_TERMINAL_SOCKET"].filter((name) => process.env[name]);
  return [];
}

/** Reads the argument list of a process; empty when unreadable. */
function readArgv(pid) {
  try {
    return readFileSync(join(PROC_ROOT, String(pid), "cmdline"), "utf8").split("\0").filter(Boolean);
  } catch {
    return [];
  }
}

/** Returns the known agent a process runs, or null. Node and Bun wrappers name the agent in argv[1]. */
function agentOfProcess(proc) {
  const argv = readArgv(proc.pid);
  const base = (path) => (path ? basename(path).replace(/^\./u, "") : "");
  const candidates = [proc.name, base(argv[0])];
  if (["node", "bun"].includes(proc.name) || ["node", "bun"].includes(base(argv[0]))) candidates.push(base(argv[1]));
  const name = candidates.map((c) => c.replace(/^\./u, "")).find((c) => KNOWN_AGENTS[c]);
  return name ? { name, argv } : null;
}

/**
 * Finds the coding agent this script runs under: the nearest ancestor that is
 * a known agent, stopping at the Herdr host. Falls back to what Herdr reports
 * for the terminal or pane, then to `CLAUDECODE=1`, which Claude Code sets.
 * `permissions` tells whether the agent's command line carries the flag that
 * skips approvals (null when the command line is unknown).
 */
function detectAgent(reported) {
  let current = readProcess(START_PID);
  while (current && current.ppid > 1) {
    const parent = readProcess(current.ppid);
    if (!parent || SURFACE_BY_PROCESS[parent.name]) break;
    const found = agentOfProcess(parent);
    if (found) {
      const flags = KNOWN_AGENTS[found.name];
      const permissions = flags.length === 0 ? null : found.argv.some((arg) => flags.includes(arg));
      return { name: found.name, source: "process", pid: parent.pid, permissions };
    }
    current = parent;
  }
  const fromHerdr = normalizeAgent(reported);
  if (fromHerdr) return { name: fromHerdr, source: "herdr", pid: null, permissions: null };
  if (process.env.CLAUDECODE === "1") return { name: "claude", source: "env", pid: null, permissions: null };
  return { name: null, source: null, pid: null, permissions: null };
}

/** Maps the program names Herdr reports ("claude-code") to the agent names used here. */
function normalizeAgent(program) {
  if (!program) return null;
  const name = String(program).toLowerCase().replace(/-code$/u, "").replace(/-cli$/u, "");
  return KNOWN_AGENTS[name] ? name : null;
}

/** Tells which Herdr binaries are on PATH. */
function installedBinaries() {
  return { herdr: onPath("herdr"), hc: onPath("hc"), herdrApp: onPath("herdr-app") };
}

/** Official install commands for this platform, optionally only for some products. */
function installCommands(products = ["tui", "desktop", "core"]) {
  const table = INSTALL[process.platform === "win32" ? "win32" : process.platform === "darwin" ? "darwin" : "linux"];
  return table.filter((item) => products.includes(item.product));
}

/**
 * Reads the person's placement preference from the herdrfy config file:
 * `{ "open": "auto" | "pane" | "tab" }`. A missing file means "auto".
 */
function readPreference() {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  const file = process.env.HERDRFY_CONFIG || join(base, "herdrfy", "config.json");
  if (!existsSync(file)) return { open: "auto", file, exists: false };
  try {
    const open = JSON.parse(readFileSync(file, "utf8")).open ?? "auto";
    if (!["auto", "pane", "tab"].includes(open)) return { open: "auto", file, exists: true, error: `invalid open value: ${open}` };
    return { open, file, exists: true };
  } catch (error) {
    return { open: "auto", file, exists: true, error: error instanceof Error ? error.message.split("\n")[0] : String(error) };
  }
}

/**
 * Says where the next terminal should open: "pane" in the requester's tab,
 * a new "tab", an "auxiliary" terminal without a pane (Desktop), or null when
 * the agent has no pane to work from. The person's explicit word in the
 * request always wins over this advice.
 */
function advise(data, preference) {
  const result = (open, direction, reason, source) => ({ open, direction, reason, source });
  if (data.surface === "desktop") {
    if (!data.found) return result("auxiliary", null, "this process is not a core terminal; open terminals by address", "placement");
    if (data.terminal.placement !== "tab") return result("auxiliary", null, "this terminal has no tab labels to repeat; a visible tab needs a new space, so ask first", "placement");
    if (preference.open !== "auto") return result(preference.open, null, `the person's preference in ${preference.file}`, "preference");
    const count = data.neighbors.length + 1;
    if (count >= DESKTOP_MAX_PANES) return result("tab", null, `this tab already shows ${count} terminals; one more pane would be too narrow to read`, "layout");
    return result("pane", null, `this tab shows ${count} terminal(s); the window places the new pane`, "layout");
  }
  if (data.surface === "tui") {
    if (!data.found) return result(null, null, "no pane of this session hosts this agent; ask before opening anything", "placement");
    if (preference.open !== "auto") return result(preference.open, preference.open === "pane" ? splitDirection(data) : null, `the person's preference in ${preference.file}`, "preference");
    const size = data.pane.size;
    if (data.tab.panes >= TUI_MAX_PANES) return result("tab", null, `this tab already has ${data.tab.panes} panes`, "layout");
    if (!size) return result("pane", "right", "pane size unknown; split to the right and read the result", "layout");
    const direction = splitDirection(data);
    if (direction) return result("pane", direction, `the pane is ${size.width}x${size.height}; both halves stay readable`, "layout");
    return result("tab", null, `the pane is ${size.width}x${size.height}; a split would leave less than ${MIN_COLS} columns or ${MIN_ROWS} rows`, "layout");
  }
  return result(null, null, "outside Herdr", "placement");
}

/**
 * Picks the split that keeps both halves readable: right when wide enough,
 * else down, else null. Herdr splits a pane into two exact halves (120
 * columns become 60 and 60), so each half is the size divided by two.
 */
function splitDirection(data) {
  const size = data.pane.size;
  if (!size) return "right";
  if (Math.floor(size.width / 2) >= MIN_COLS) return "right";
  if (Math.floor(size.height / 2) >= MIN_ROWS) return "down";
  return null;
}

/** Walks up to the Herdr server and returns its direct child shell. */
function paneShell() {
  let current = readProcess(START_PID);
  while (current && current.ppid > 1) {
    const parent = readProcess(current.ppid);
    if (!parent) return undefined;
    if (parent.name === "herdr") return current.pid;
    current = parent;
  }
  return undefined;
}

/**
 * Locates the pane in the Herdr TUI by its shell, with the variables as
 * fallback. The fallback is skipped when the process tree says the agent runs
 * in a herdr-core terminal: those variables belong to a TUI that ran before,
 * and accepting the pane would send the agent to the wrong surface.
 */
function locateOnTui(processSurfaceName) {
  const workspaces = herdr("workspace", "list").workspaces;
  const panes = workspaces.flatMap((w) => herdr("pane", "list", "--workspace", w.workspace_id).panes);
  const workspaceSummary = workspaces.map((w) => ({ id: w.workspace_id, label: w.label, tabs: w.tab_count, panes: w.pane_count }));
  const shell = paneShell();
  const envPane = process.env.HERDR_PANE_ID;
  let pane;
  let method = "processes";
  if (shell !== undefined) {
    // Check the pane named by the variables first; it is usually right.
    const ordered = [...panes].sort((a, b) => Number(b.pane_id === envPane) - Number(a.pane_id === envPane));
    pane = ordered.find((item) => {
      try {
        return herdr("pane", "process-info", "--pane", item.pane_id).process_info.shell_pid === shell;
      } catch {
        return false;
      }
    });
  }
  if (!pane && processSurfaceName !== "desktop") {
    method = "env";
    pane = panes.find((item) => item.pane_id === envPane);
  }
  if (!pane) {
    // This process does not run in a pane of this TUI session. The workspace
    // list lets the agent work with explicit IDs, without `--current`.
    return { surface: "tui", found: false, cli: "herdr", workspace: null, tab: null, pane: null, neighbors: [], envCurrent: false, method: null, workspaces: workspaceSummary };
  }
  const workspace = workspaces.find((w) => w.workspace_id === pane.workspace_id);
  const tab = herdr("tab", "list", "--workspace", pane.workspace_id).tabs.find((t) => t.tab_id === pane.tab_id);
  // Geometry is optional: older servers or a failed call leave it unknown.
  let layout = null;
  try {
    layout = herdr("pane", "layout", "--pane", pane.pane_id).layout;
  } catch {
    layout = null;
  }
  const rect = layout?.panes?.find((p) => p.pane_id === pane.pane_id)?.rect;
  const inTab = panes.filter((p) => p.tab_id === pane.tab_id);
  return {
    surface: "tui",
    found: true,
    cli: "herdr",
    workspace: { id: pane.workspace_id, label: workspace?.label ?? null },
    tab: { id: pane.tab_id, label: tab?.label ?? null, panes: layout?.panes?.length ?? inTab.length },
    pane: {
      id: pane.pane_id,
      cwd: pane.foreground_cwd ?? pane.cwd ?? null,
      agent: pane.agent ?? null,
      size: rect ? { width: rect.width, height: rect.height } : null,
    },
    neighbors: inTab
      .filter((p) => p.pane_id !== pane.pane_id)
      .map((p) => ({ id: p.pane_id, agent: p.agent ?? null, status: p.agent_status ?? null, cwd: p.foreground_cwd ?? p.cwd ?? null })),
    envCurrent: envPane === pane.pane_id,
    method,
    workspaces: workspaceSummary,
  };
}

/** Prints the Desktop answer as text. */
function printDesktop(data) {
  console.log("Surface:   Herdr Desktop / herdr-core (use hc, not herdr)");
  console.log(`Window:    herdr-app ${data.window.available ? "available on this machine" : "not on this machine; tabs and panes go through hc labels"}`);
  if (!data.found) {
    console.log("Terminal:  this process is not a core terminal; work with the addresses below.");
  } else {
    const t = data.terminal;
    console.log(`Terminal:  ${t.id}${t.name ? ` (${t.name})` : ""}${t.where ? ` in ${t.where}` : ""}`);
    if (t.placement === "tab") {
      console.log(`Space:     ${t.space}`);
      console.log(`Tab:       ${t.tab}`);
    } else if (t.placement === "unlabeled") {
      console.log(`Placement: shown as "${t.where}" but without herdr.space and herdr.tab labels; there is no tab to repeat`);
    } else {
      console.log("Placement: no herdr.space, herdr.tab or where label; this terminal is outside the window");
    }
    if (t.identity) console.log(`Identity:  ${t.identity}`);
    console.log(`Folder:    ${t.cwd}`);
    if (t.program) console.log(`Program:   ${t.program}${t.status ? ` (${t.status})` : ""}`);
    if (t.parent) console.log(`Parent:    ${t.parent}`);
  }
  for (const n of data.neighbors) {
    console.log(`Neighbor:  ${n.id}${n.name ? ` (${n.name})` : ""} ${n.program ?? ""}${n.status ? ` (${n.status})` : ""}${n.where ? ` in ${n.where}` : ""}`.trimEnd());
  }
}

/** Prints the TUI answer as text. */
function printTui(data) {
  console.log("Surface:   Herdr TUI (use herdr, not hc)");
  if (!data.found) {
    console.log("Pane:      this process does not run in a pane of this session; use explicit IDs, without --current.");
    for (const w of data.workspaces) console.log(`Workspace: ${w.label} (${w.id}), ${w.tabs} tab(s), ${w.panes} pane(s)`);
    return;
  }
  console.log(`Workspace: ${data.workspace.label} (${data.workspace.id})`);
  console.log(`Tab:       ${data.tab.label ?? "unnamed"} (${data.tab.id})`);
  const size = data.pane.size ? `, ${data.pane.size.width}x${data.pane.size.height}` : "";
  console.log(`Pane:      ${data.pane.id}${data.pane.agent ? ` running ${data.pane.agent}` : ""}${size}; ${data.tab.panes} pane(s) in this tab`);
  console.log(`Folder:    ${data.pane.cwd}`);
  for (const n of data.neighbors) console.log(`Neighbor:  ${n.id}${n.agent ? ` ${n.agent}` : ""}${n.status && n.status !== "unknown" ? ` (${n.status})` : ""}`);
  if (!data.envCurrent) console.log(`Warning: HERDR_PANE_ID=${process.env.HERDR_PANE_ID ?? "empty"} is stale; use ${data.pane.id}.`);
  if (data.method === "env") console.log("Warning: position taken from the environment variables, not checked against the processes.");
}

/**
 * Prints the warning about inherited variables. The direction follows the
 * process tree (or the chosen surface when the tree gives none), so a
 * `--surface` that contradicts the tree still names the right origin.
 */
function printInherited(data) {
  const names = data.detection.inheritedEnv;
  if (names.length === 0) return;
  const list = names.map((name) => `${name}=${process.env[name]}`).join(", ");
  const base = data.detection.process ?? data.surface;
  if (base === "desktop") {
    console.log(`Warning:   ${list} came from a Herdr TUI; herdr commands from here reach the TUI, not this window. Use hc.`);
    // herdr-core 0.1.19+ keeps the environment it started with across updates
    // and restarts; 0.1.20+ can replace it without ending running programs.
    console.log("Fix:       the core started inside a Herdr TUI and passes its variables to every new terminal. If the person agrees, they run `hc server restart --fresh` from a terminal outside Herdr; running programs keep going.");
  } else console.log(`Warning:   ${list} came from a herdr-core terminal; hc commands from here reach the core, not this pane. Use herdr.`);
}

/** Prints the answer as readable text or as JSON. */
function print(data, json) {
  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  if (data.mismatch) {
    const other = data.detection.process === "desktop" ? "Herdr Desktop (herdr-core)" : "Herdr TUI";
    console.log(`Warning:   this process runs under ${other}, not under Herdr ${data.surface === "desktop" ? "Desktop" : "TUI"}; the commands of this surface do not reach where this agent runs.`);
  }
  printInherited(data);
  if (data.missing) {
    console.log(`Not installed: ${data.missing} is not on PATH, so Herdr ${data.surface === "desktop" ? "Desktop" : "TUI"} cannot be read from here.`);
  } else if (!data.surface) {
    console.log("Outside Herdr: this agent runs neither in a herdr-core terminal nor in a Herdr TUI pane.");
    const names = Object.entries({ herdr: data.installed.herdr, hc: data.installed.hc, "herdr-app": data.installed.herdrApp })
      .filter(([, present]) => present)
      .map(([name]) => name);
    console.log(names.length > 0 ? `Installed: ${names.join(", ")}` : "Not installed: no Herdr binary on this machine.");
  } else if (data.surface === "desktop") printDesktop(data);
  else printTui(data);
  if (data.install) {
    console.log("Install (ask the person first):");
    for (const item of data.install) console.log(`  ${item.product.padEnd(8)}${item.command}`);
  }
  if (data.agent.name) {
    const flags = data.agent.permissions === true ? ", permissions skipped" : data.agent.permissions === false ? ", WITHOUT the permission flag" : "";
    console.log(`Agent:     ${data.agent.name} (from ${data.agent.source}${flags})`);
  }
  if (data.preference.error) console.log(`Warning:   ignored ${data.preference.file}: ${data.preference.error}`);
  if (data.advice.open) {
    const what = data.advice.open === "pane" ? `a pane${data.advice.direction ? ` to the ${data.advice.direction === "down" ? "bottom" : "right"}` : ""} in this tab` : data.advice.open === "tab" ? "a new tab" : "an auxiliary terminal, without a pane";
    console.log(`Next:      ${what}; ${data.advice.reason}. The person's words win.`);
  }
}

const options = parseArgs(process.argv.slice(2));
try {
  const fromProcess = processSurface();
  const fromEnv = envSurface();
  const surface = options.surface ?? fromProcess ?? fromEnv;
  const detection = {
    process: fromProcess,
    env: fromEnv,
    termProgram: process.env.TERM_PROGRAM || null,
    inheritedEnv: inheritedEnv(fromProcess ?? surface),
  };
  const mismatch = Boolean(options.surface && fromProcess && options.surface !== fromProcess);
  const installed = installedBinaries();
  let data;
  if (surface === "desktop" && !installed.hc) {
    data = { surface, found: false, missing: "hc", install: installCommands(["desktop", "core"]) };
  } else if (surface === "tui" && !installed.herdr) {
    data = { surface, found: false, missing: "herdr", install: installCommands(["tui"]) };
  } else if (surface === "desktop") data = locateOnDesktop();
  else if (surface === "tui") data = locateOnTui(fromProcess);
  else {
    data = { surface: null, found: false };
    if (!installed.herdr && !installed.hc) data.install = installCommands();
  }
  data.installed = installed;
  data.detection = detection;
  if (mismatch) data.mismatch = true;
  data.agent = detectAgent(data.terminal?.program ?? data.pane?.agent);
  const preference = readPreference();
  data.preference = preference;
  data.advice = data.missing ? { open: null, direction: null, reason: `${data.missing} is not installed`, source: "placement" } : advise(data, preference);
  print(data, options.json);
} catch (error) {
  const detail = error instanceof Error ? error.message.split("\n")[0] : String(error);
  console.error(`Could not query Herdr: ${detail}`);
  process.exitCode = 1;
}
