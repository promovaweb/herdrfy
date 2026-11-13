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
 * reads the variables: `HC_TERMINAL_ID` means desktop and wins over
 * `HERDR_ENV=1`, which means tui. Core terminals often inherit `HERDR_ENV=1`
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
 *     detection, mismatch? }
 *   TUI: { surface: "tui", found, cli: "herdr", workspace, tab, pane,
 *     envCurrent, method, workspaces: [...], detection, mismatch? }
 *   Outside Herdr: { surface: null, found: false, detection }
 *
 * The `detection` object appears in every answer:
 *   process       surface given by the process tree: "desktop", "tui" or null
 *   env           surface the variables alone would give: "desktop", "tui" or
 *                 null
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
import { delimiter, join } from "node:path";

/** Root of the process table; `HERDRFY_PROC_ROOT` lets the tests replace it. */
const PROC_ROOT = process.env.HERDRFY_PROC_ROOT || "/proc";

/** First pid of the walk; `HERDRFY_PID` lets the tests start from a fake one. */
const START_PID = Number(process.env.HERDRFY_PID ?? process.pid);

/** Process names that mark a surface, one per ancestor kind. */
const SURFACE_BY_PROCESS = { "herdr-core": "desktop", herdr: "tui" };

/** Position variables of a Herdr TUI, in the order the answer lists them. */
// HERDR_SOCKET_PATH is the one that routes the `herdr` CLI to the TUI server.
const TUI_VARIABLES = ["HERDR_ENV", "HERDR_SOCKET_PATH", "HERDR_PANE_ID", "HERDR_WORKSPACE_ID", "HERDR_TAB_ID"];

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

/** Returns the surface the environment variables alone indicate. */
function envSurface() {
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
    return { surface: "tui", found: false, cli: "herdr", workspace: null, tab: null, pane: null, envCurrent: false, method: null, workspaces: workspaceSummary };
  }
  const workspace = workspaces.find((w) => w.workspace_id === pane.workspace_id);
  const tab = herdr("tab", "list", "--workspace", pane.workspace_id).tabs.find((t) => t.tab_id === pane.tab_id);
  return {
    surface: "tui",
    found: true,
    cli: "herdr",
    workspace: { id: pane.workspace_id, label: workspace?.label ?? null },
    tab: { id: pane.tab_id, label: tab?.label ?? null },
    pane: { id: pane.pane_id, cwd: pane.foreground_cwd ?? pane.cwd ?? null, agent: pane.agent ?? null },
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
  console.log(`Pane:      ${data.pane.id}${data.pane.agent ? ` running ${data.pane.agent}` : ""}`);
  console.log(`Folder:    ${data.pane.cwd}`);
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
  if (base === "desktop") console.log(`Warning:   ${list} came from a Herdr TUI; herdr commands from here reach the TUI, not this window. Use hc.`);
  else console.log(`Warning:   ${list} came from a herdr-core terminal; hc commands from here reach the core, not this pane. Use herdr.`);
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
  if (!data.surface) console.log("Outside Herdr: this agent runs neither in a herdr-core terminal nor in a Herdr TUI pane.");
  else if (data.surface === "desktop") printDesktop(data);
  else printTui(data);
}

const options = parseArgs(process.argv.slice(2));
try {
  const fromProcess = processSurface();
  const fromEnv = envSurface();
  const surface = options.surface ?? fromProcess ?? fromEnv;
  const detection = { process: fromProcess, env: fromEnv, inheritedEnv: inheritedEnv(fromProcess ?? surface) };
  const mismatch = Boolean(options.surface && fromProcess && options.surface !== fromProcess);
  let data;
  if (surface === "desktop") data = locateOnDesktop();
  else if (surface === "tui") data = locateOnTui(fromProcess);
  else data = { surface: null, found: false };
  data.detection = detection;
  if (mismatch) data.mismatch = true;
  print(data, options.json);
} catch (error) {
  const detail = error instanceof Error ? error.message.split("\n")[0] : String(error);
  console.error(`Could not query Herdr: ${detail}`);
  process.exitCode = 1;
}
