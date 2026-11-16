/**
 * File: tests/scripts.test.mjs
 * Description: Tests for the skill scripts that do not need a running Herdr:
 * the instruction block (create, update, check, remove, legacy markers), the
 * argument handling of the three scripts, and the locator against fake `hc`
 * and `herdr` executables placed on PATH.
 * Usage: `npm test` (node --test).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const scripts = resolve(dirname(fileURLToPath(import.meta.url)), "..", "skills", "herdrfy", "scripts");
const instructions = join(scripts, "instructions.mjs");
const where = join(scripts, "where.mjs");
const doctor = join(scripts, "doctor.mjs");
const unix = process.platform !== "win32";

/** Runs a script and returns exit code, stdout and stderr. */
function run(script, args, env = process.env) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: "utf8", env });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

/** Empty process table, so the real one of this machine does not interfere. */
const emptyProc = mkdtempSync(join(tmpdir(), "herdrfy-proc-empty-"));

/** Returns a copy of the environment without any Herdr variable. */
function cleanEnv(extra = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith("HC_") || key.startsWith("HERDR_") || key.startsWith("HERDRFY_") || key === "TERM_PROGRAM") delete env[key];
  }
  return { ...env, HERDRFY_PROC_ROOT: emptyProc, HERDRFY_CONFIG: join(emptyProc, "no-config.json"), ...extra };
}

/**
 * Creates a fake process table: `tree` maps a pid to [name, ppid]. Each pid
 * gets a `<pid>/stat` file in the real format, `123 (name) S 1 ...`, and,
 * when a third item lists the arguments, a NUL-separated `<pid>/cmdline`.
 */
function fakeProc(tree) {
  const dir = mkdtempSync(join(tmpdir(), "herdrfy-proc-"));
  for (const [pid, [name, ppid, argv]] of Object.entries(tree)) {
    mkdirSync(join(dir, pid));
    writeFileSync(join(dir, pid, "stat"), `${pid} (${name}) S ${ppid} ${pid} ${pid} 0 -1 4194560 0 0 0 0 0 0 0 20 0 1 0 0 0 0 0\n`);
    if (argv) writeFileSync(join(dir, pid, "cmdline"), `${argv.join("\0")}\0`);
  }
  return dir;
}

/**
 * Creates a folder with a fake executable that prints canned JSON. `answers`
 * maps the first two arguments joined by a space ("get t1", "pane list") to
 * the object to print; a one-word key ("ls") matches the first argument.
 */
function fakeCli(name, answers) {
  const dir = mkdtempSync(join(tmpdir(), "herdrfy-bin-"));
  const cases = Object.entries(answers)
    .map(([key, value]) => `  "${key}") cat <<'JSON'\n${JSON.stringify(value)}\nJSON\n  ;;`)
    .join("\n");
  const body = `#!/bin/sh\nfor key in "$1 $2" "$1"; do\n  case "$key" in\n${cases}\n  *) continue ;;\n  esac\n  exit 0\ndone\necho "unexpected call: $*" >&2\nexit 1\n`;
  writeFileSync(join(dir, name), body);
  chmodSync(join(dir, name), 0o755);
  return dir;
}

test("instructions: creates AGENTS.md and CLAUDE.md in an empty project", () => {
  const dir = mkdtempSync(join(tmpdir(), "herdrfy-"));
  assert.equal(run(instructions, ["--project", dir, "--check"]).code, 1);
  assert.equal(run(instructions, ["--project", dir]).code, 0);
  const agents = readFileSync(join(dir, "AGENTS.md"), "utf8");
  assert.match(agents, /<!-- herdrfy:start -->/u);
  assert.match(agents, /<!-- herdrfy:end -->/u);
  assert.match(agents, /claude --permission-mode=auto --dangerously-skip-permissions/u);
  assert.match(agents, /codex --yolo --no-daemon/u);
  assert.match(agents, /opencode --auto/u);
  assert.match(agents, /where\.mjs/u);
  assert.doesNotMatch(agents, /\{\{WHERE\}\}/u);
  // CLAUDE.md is born as a link or as a file with the same block.
  assert.match(readFileSync(join(dir, "CLAUDE.md"), "utf8"), /herdrfy:start/u);
  assert.equal(run(instructions, ["--project", dir, "--check"]).code, 0);
});

test("instructions: keeps the existing text and does not duplicate the block", () => {
  const dir = mkdtempSync(join(tmpdir(), "herdrfy-"));
  writeFileSync(join(dir, "AGENTS.md"), "# Project\n\nOwn rule.\n");
  writeFileSync(join(dir, "CLAUDE.md"), "# Claude\n");
  run(instructions, ["--project", dir]);
  run(instructions, ["--project", dir]);
  for (const name of ["AGENTS.md", "CLAUDE.md"]) {
    const text = readFileSync(join(dir, name), "utf8");
    assert.equal(text.split("<!-- herdrfy:start -->").length, 2, `${name} has a single block`);
    assert.equal(lstatSync(join(dir, name)).isSymbolicLink(), false);
  }
  assert.match(readFileSync(join(dir, "AGENTS.md"), "utf8"), /^# Project\n\nOwn rule\.\n/u);
});

test("instructions: replaces an outdated block with the current one", () => {
  const dir = mkdtempSync(join(tmpdir(), "herdrfy-"));
  const file = join(dir, "AGENTS.md");
  writeFileSync(file, "before\n\n<!-- herdrfy:start -->\nold\n<!-- herdrfy:end -->\n\nafter\n");
  const check = run(instructions, ["--file", file, "--check", "--json"]);
  assert.equal(check.code, 1);
  assert.equal(JSON.parse(check.out).files[0].state, "outdated");
  run(instructions, ["--file", file]);
  const text = readFileSync(file, "utf8");
  assert.doesNotMatch(text, /\nold\n/u);
  assert.match(text, /^before\n/u);
  assert.match(text, /\nafter\n$/u);
});

test("instructions: rewrites a block with the markers used before 0.2.0", () => {
  const dir = mkdtempSync(join(tmpdir(), "herdrfy-"));
  const file = join(dir, "AGENTS.md");
  writeFileSync(file, "before\n\n<!-- herdrfy:inicio -->\nold\n<!-- herdrfy:fim -->\n\nafter\n");
  assert.equal(JSON.parse(run(instructions, ["--file", file, "--check", "--json"]).out).files[0].state, "outdated");
  run(instructions, ["--file", file]);
  const text = readFileSync(file, "utf8");
  assert.doesNotMatch(text, /herdrfy:inicio|herdrfy:fim/u);
  assert.equal(text.split("<!-- herdrfy:start -->").length, 2);
  assert.match(text, /^before\n/u);
  assert.match(text, /\nafter\n$/u);
  // --remove also takes a legacy block out.
  writeFileSync(file, "before\n\n<!-- herdrfy:inicio -->\nold\n<!-- herdrfy:fim -->\n");
  run(instructions, ["--file", file, "--remove"]);
  assert.equal(readFileSync(file, "utf8"), "before\n");
});

test("instructions: --remove returns the file to its original text", () => {
  const dir = mkdtempSync(join(tmpdir(), "herdrfy-"));
  const original = "# Project\n\nOwn rule.\n";
  writeFileSync(join(dir, "AGENTS.md"), original);
  writeFileSync(join(dir, "CLAUDE.md"), original);
  run(instructions, ["--project", dir]);
  run(instructions, ["--project", dir, "--remove"]);
  assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8"), original);
  assert.equal(readFileSync(join(dir, "CLAUDE.md"), "utf8"), original);
});

test("instructions: warns when the file tells agents to start through an alias", () => {
  const dir = mkdtempSync(join(tmpdir(), "herdrfy-"));
  const file = join(dir, "AGENTS.md");
  writeFileSync(file, "# Project\n\nUse `zsh -ic cx` to open Codex.\n");
  assert.deepEqual(JSON.parse(run(instructions, ["--file", file, "--json"]).out).files[0].conflicts, [3]);
  // The block itself is not scanned.
  writeFileSync(file, "# Project\n");
  assert.equal(JSON.parse(run(instructions, ["--file", file, "--json"]).out).files[0].conflicts, undefined);
});

test("all scripts: --help prints usage and exits 0", () => {
  for (const script of [where, doctor, instructions]) {
    const r = run(script, ["--help"], cleanEnv());
    assert.equal(r.code, 0);
    assert.match(r.out, /^Usage: node /u);
  }
});

test("all scripts: an unknown argument exits 2", () => {
  for (const script of [where, doctor, instructions]) {
    const r = run(script, ["--no-such-flag"], cleanEnv());
    assert.equal(r.code, 2);
    assert.match(r.err, /Unknown argument: --no-such-flag/u);
  }
  assert.equal(run(instructions, ["--project"]).code, 2);
  assert.equal(run(instructions, ["--file"]).code, 2);
});

test("where: outside Herdr answers a null surface with code 0", { skip: !unix }, () => {
  const bin = fakeCli("herdr", {});
  const r = run(where, ["--json"], cleanEnv({ PATH: `${bin}:/usr/bin:/bin` }));
  assert.equal(r.code, 0);
  const data = JSON.parse(r.out);
  assert.equal(data.surface, null);
  assert.equal(data.found, false);
  assert.deepEqual(data.detection, { process: null, env: null, termProgram: null, inheritedEnv: [] });
  assert.deepEqual(data.installed, { herdr: true, hc: false, herdrApp: false });
  assert.equal(data.install, undefined);
  assert.equal(data.advice.open, null);
});

test("where: without any Herdr binary it lists the install commands", { skip: !unix }, () => {
  const empty = mkdtempSync(join(tmpdir(), "herdrfy-empty-"));
  const env = cleanEnv({ PATH: empty });
  const data = JSON.parse(run(where, ["--json"], env).out);
  assert.deepEqual(data.installed, { herdr: false, hc: false, herdrApp: false });
  assert.deepEqual(data.install.map((i) => i.product).filter((p, i, all) => all.indexOf(p) === i), ["tui", "desktop", "core"]);
  assert.ok(data.install.some((i) => i.command === "curl -fsSL https://herdr.dev/install.sh | sh"));
  const text = run(where, [], env).out;
  assert.match(text, /^Not installed: no Herdr binary on this machine\./mu);
  assert.match(text, /^Install \(ask the person first\):/mu);
});

test("where: a surface whose command is missing reports it with its install commands", { skip: !unix }, () => {
  const empty = mkdtempSync(join(tmpdir(), "herdrfy-empty-"));
  const r = run(where, ["--json"], cleanEnv({ PATH: empty, HC_TERMINAL_ID: "t1" }));
  assert.equal(r.code, 0, r.err);
  const data = JSON.parse(r.out);
  assert.equal(data.surface, "desktop");
  assert.equal(data.missing, "hc");
  assert.deepEqual([...new Set(data.install.map((i) => i.product))], ["desktop", "core"]);
  assert.equal(data.advice.open, null);
});

test("where: an invalid or missing surface exits 2", () => {
  assert.equal(run(where, ["--surface", "window"]).code, 2);
  assert.equal(run(where, ["--surface"]).code, 2);
});

test("where: desktop terminal in a tab reports labels and neighbors", { skip: !unix }, () => {
  const labels = { "herdr.space": "sp1", "herdr.tab": "tb1", where: "api / docs" };
  const bin = fakeCli("hc", {
    "get t1": { address: "t1", name: null, cwd: "/work", labels, identity: "ghostty", state: "live", status: { app: "claude-code", state: "working" }, parent: null },
    ls: { terminals: [{ address: "t1" }, { address: "t2", agent: "codex", status: "idle", where: "api / docs" }] },
  });
  const r = run(where, ["--json", "--surface", "hc"], cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HC_TERMINAL_ID: "t1", HERDR_ENV: "1" }));
  assert.equal(r.code, 0, r.err);
  const data = JSON.parse(r.out);
  assert.equal(data.surface, "desktop");
  assert.equal(data.found, true);
  assert.deepEqual(
    { id: data.terminal.id, space: data.terminal.space, tab: data.terminal.tab, placement: data.terminal.placement, program: data.terminal.program, status: data.terminal.status },
    { id: "t1", space: "sp1", tab: "tb1", placement: "tab", program: "claude-code", status: "working" },
  );
  assert.deepEqual(data.neighbors.map((n) => n.id), ["t2"]);
});

test("where: desktop terminal with a where label but no tab labels is unlabeled", { skip: !unix }, () => {
  const bin = fakeCli("hc", {
    "get t26": { address: "t26", cwd: "/work", labels: { "herdr.seen": "1", where: "herdrfy / main" }, identity: "herdr-mobile", state: "live" },
  });
  const env = cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HC_TERMINAL_ID: "t26" });
  const data = JSON.parse(run(where, ["--json"], env).out);
  assert.equal(data.terminal.placement, "unlabeled");
  assert.equal(data.terminal.space, null);
  assert.equal(data.terminal.identity, "herdr-mobile");
  assert.deepEqual(data.neighbors, []);
  const text = run(where, [], env).out;
  assert.match(text, /Placement: shown as "herdrfy \/ main"/u);
  assert.doesNotMatch(text, /outside the window/u);
});

test("where: desktop terminal without labels is outside the window", { skip: !unix }, () => {
  const bin = fakeCli("hc", { "get t2": { address: "t2", cwd: "/work", labels: {}, state: "live" } });
  const env = cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HC_TERMINAL_ID: "t2" });
  assert.equal(JSON.parse(run(where, ["--json"], env).out).terminal.placement, "none");
  assert.match(run(where, [], env).out, /outside the window/u);
});

test("where: desktop named by the person outside a core terminal lists the live ones", { skip: !unix }, () => {
  const bin = fakeCli("hc", { ls: { terminals: [{ address: "t5", agent: "zsh", where: "api / main" }] } });
  const data = JSON.parse(run(where, ["--json", "--surface", "desktop"], cleanEnv({ PATH: `${bin}:/usr/bin:/bin` })).out);
  assert.equal(data.found, false);
  assert.equal(data.terminal, null);
  assert.deepEqual(data.neighbors.map((n) => n.id), ["t5"]);
});

test("where: TUI pane found through the environment variables", { skip: !unix }, () => {
  const bin = fakeCli("herdr", {
    "workspace list": { result: { workspaces: [{ workspace_id: "w1", label: "api", tab_count: 2, pane_count: 3 }] } },
    "pane list": { result: { panes: [{ pane_id: "w1:p5", workspace_id: "w1", tab_id: "w1:t2", cwd: "/work", agent: "claude" }] } },
    "tab list": { result: { tabs: [{ tab_id: "w1:t2", label: "agents" }] } },
  });
  const data = JSON.parse(run(where, ["--json"], cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HERDR_ENV: "1", HERDR_PANE_ID: "w1:p5" })).out);
  assert.equal(data.surface, "tui");
  assert.equal(data.found, true);
  assert.deepEqual(data.workspace, { id: "w1", label: "api" });
  assert.deepEqual(data.tab, { id: "w1:t2", label: "agents", panes: 1 });
  assert.deepEqual(data.pane, { id: "w1:p5", cwd: "/work", agent: "claude", size: null });
  // Without geometry the advice still opens a pane, to the right.
  assert.deepEqual([data.advice.open, data.advice.direction], ["pane", "right"]);
  assert.equal(data.envCurrent, true);
  assert.equal(data.method, "env");
});

test("where: TUI process outside every pane answers found false", { skip: !unix }, () => {
  const bin = fakeCli("herdr", {
    "workspace list": { result: { workspaces: [{ workspace_id: "w1", label: "api", tab_count: 1, pane_count: 1 }] } },
    "pane list": { result: { panes: [{ pane_id: "w1:p1", workspace_id: "w1", tab_id: "w1:t1" }] } },
  });
  const data = JSON.parse(run(where, ["--json", "--surface", "tui"], cleanEnv({ PATH: `${bin}:/usr/bin:/bin` })).out);
  assert.equal(data.found, false);
  assert.deepEqual(data.workspaces, [{ id: "w1", label: "api", tabs: 1, panes: 1 }]);
});

test("where: a failing hc exits 1", { skip: !unix }, () => {
  const bin = fakeCli("hc", {});
  const r = run(where, [], cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HC_TERMINAL_ID: "t1" }));
  assert.equal(r.code, 1);
  assert.match(r.err, /Could not query Herdr/u);
});

test("where: core terminal with inherited TUI variables answers desktop", { skip: !unix }, () => {
  const bin = fakeCli("hc", {
    "get t1": { address: "t1", cwd: "/work", labels: { "herdr.space": "sp1", "herdr.tab": "tb1", where: "api / docs" }, state: "live" },
    ls: { terminals: [{ address: "t1" }, { address: "t2", agent: "codex", status: "idle" }] },
  });
  const proc = fakeProc({ 500: ["zsh", 501], 501: ["herdr-core", 502], 502: ["systemd", 1] });
  const env = cleanEnv({
    PATH: `${bin}:/usr/bin:/bin`,
    HC_TERMINAL_ID: "t1",
    HERDR_ENV: "1",
    HERDR_PANE_ID: "w0:p1V",
    HERDRFY_PROC_ROOT: proc,
    HERDRFY_PID: "500",
  });
  const data = JSON.parse(run(where, ["--json"], env).out);
  assert.equal(data.surface, "desktop");
  assert.equal(data.found, true);
  assert.deepEqual(data.detection, { process: "desktop", env: "desktop", termProgram: null, inheritedEnv: ["HERDR_ENV", "HERDR_PANE_ID"] });
  const text = run(where, [], env).out;
  assert.match(text, /^Surface: +Herdr Desktop/mu);
  assert.match(text, /^Warning: +HERDR_ENV=1, HERDR_PANE_ID=w0:p1V came from a Herdr TUI/mu);
  assert.match(text, /^Fix: +.*hc server restart --fresh/mu);
});

test("where: TUI pane with an inherited HC_TERMINAL_ID answers tui", { skip: !unix }, () => {
  const bin = fakeCli("herdr", {
    "workspace list": { result: { workspaces: [{ workspace_id: "w1", label: "api", tab_count: 1, pane_count: 1 }] } },
    "pane list": { result: { panes: [{ pane_id: "w1:p5", workspace_id: "w1", tab_id: "w1:t1", cwd: "/work", agent: "claude" }] } },
    "pane process-info": { result: { process_info: { shell_pid: 600 } } },
    "tab list": { result: { tabs: [{ tab_id: "w1:t1", label: "agents" }] } },
  });
  const proc = fakeProc({ 600: ["zsh", 601], 601: ["herdr", 602], 602: ["systemd", 1] });
  const env = cleanEnv({
    PATH: `${bin}:/usr/bin:/bin`,
    HC_TERMINAL_ID: "t1",
    HERDR_ENV: "1",
    HERDR_PANE_ID: "w1:p5",
    HERDRFY_PROC_ROOT: proc,
    HERDRFY_PID: "600",
  });
  const data = JSON.parse(run(where, ["--json"], env).out);
  assert.equal(data.surface, "tui");
  assert.equal(data.found, true);
  assert.equal(data.method, "processes");
  assert.deepEqual(data.detection, { process: "tui", env: "desktop", termProgram: null, inheritedEnv: ["HC_TERMINAL_ID"] });
  assert.match(run(where, [], env).out, /^Warning: +HC_TERMINAL_ID=t1 came from a herdr-core terminal/mu);
});

test("where: --surface tui inside a core terminal reports mismatch and no pane", { skip: !unix }, () => {
  const bin = fakeCli("herdr", {
    "workspace list": { result: { workspaces: [{ workspace_id: "w1", label: "api", tab_count: 1, pane_count: 1 }] } },
    "pane list": { result: { panes: [{ pane_id: "w1:p5", workspace_id: "w1", tab_id: "w1:t1" }] } },
    "tab list": { result: { tabs: [{ tab_id: "w1:t1", label: "agents" }] } },
  });
  const proc = fakeProc({ 700: ["zsh", 701], 701: ["herdr-core", 702], 702: ["systemd", 1] });
  const env = cleanEnv({
    PATH: `${bin}:/usr/bin:/bin`,
    HERDR_ENV: "1",
    HERDR_PANE_ID: "w1:p5",
    HERDRFY_PROC_ROOT: proc,
    HERDRFY_PID: "700",
  });
  const data = JSON.parse(run(where, ["--json", "--surface", "tui"], env).out);
  assert.equal(data.surface, "tui");
  assert.equal(data.found, false);
  assert.equal(data.mismatch, true);
  assert.equal(data.detection.process, "desktop");
  // Inherited variables follow the process tree, not the requested surface.
  assert.deepEqual(data.detection.inheritedEnv, ["HERDR_ENV", "HERDR_PANE_ID"]);
  const text = run(where, ["--surface", "tui"], env).out;
  assert.match(text, /^Warning: +this process runs under Herdr Desktop/mu);
  assert.match(text, /came from a Herdr TUI; herdr commands from here reach the TUI/u);
});

test("where: without herdr or herdr-core in the tree the variables decide", { skip: !unix }, () => {
  const bin = fakeCli("herdr", {
    "workspace list": { result: { workspaces: [{ workspace_id: "w1", label: "api", tab_count: 1, pane_count: 1 }] } },
    "pane list": { result: { panes: [{ pane_id: "w1:p5", workspace_id: "w1", tab_id: "w1:t1" }] } },
    "tab list": { result: { tabs: [{ tab_id: "w1:t1", label: "agents" }] } },
  });
  const proc = fakeProc({ 800: ["zsh", 801], 801: ["systemd", 1] });
  const env = cleanEnv({
    PATH: `${bin}:/usr/bin:/bin`,
    HERDR_ENV: "1",
    HERDR_PANE_ID: "w1:p5",
    HERDRFY_PROC_ROOT: proc,
    HERDRFY_PID: "800",
  });
  const data = JSON.parse(run(where, ["--json"], env).out);
  assert.equal(data.surface, "tui");
  assert.equal(data.method, "env");
  assert.deepEqual(data.detection, { process: null, env: "tui", termProgram: null, inheritedEnv: [] });
});

test("where: without /proc, TERM_PROGRAM=herdr wins over an inherited HC_TERMINAL_ID", { skip: !unix }, () => {
  const bin = fakeCli("herdr", {
    "workspace list": { result: { workspaces: [{ workspace_id: "w1", label: "api", tab_count: 1, pane_count: 1 }] } },
    "pane list": { result: { panes: [{ pane_id: "w1:p5", workspace_id: "w1", tab_id: "w1:t1" }] } },
    "tab list": { result: { tabs: [{ tab_id: "w1:t1", label: "agents" }] } },
  });
  // Empty process table, as on macOS: only the variables can decide.
  const env = cleanEnv({
    PATH: `${bin}:/usr/bin:/bin`,
    HC_TERMINAL_ID: "t1",
    HERDR_ENV: "1",
    HERDR_PANE_ID: "w1:p5",
    TERM_PROGRAM: "herdr",
  });
  const data = JSON.parse(run(where, ["--json"], env).out);
  assert.equal(data.surface, "tui");
  assert.deepEqual(data.detection, { process: null, env: "tui", termProgram: "herdr", inheritedEnv: ["HC_TERMINAL_ID"] });
});

test("where: without /proc, a core terminal identity keeps desktop", { skip: !unix }, () => {
  const bin = fakeCli("hc", {
    "get t1": { address: "t1", cwd: "/work", labels: {}, state: "live" },
    ls: { terminals: [{ address: "t1" }] },
  });
  const env = cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HC_TERMINAL_ID: "t1", HERDR_ENV: "1", TERM_PROGRAM: "ghostty" });
  const data = JSON.parse(run(where, ["--json"], env).out);
  assert.equal(data.surface, "desktop");
  assert.equal(data.detection.env, "desktop");
  assert.equal(data.detection.termProgram, "ghostty");
});

/** Fake TUI with one pane of the given size in a tab with `count` panes. */
function tuiWithLayout(width, height, count = 1) {
  const panes = Array.from({ length: count }, (_, i) => ({ pane_id: `w1:p${i + 1}`, workspace_id: "w1", tab_id: "w1:t1", agent: i === 1 ? "codex" : undefined, agent_status: i === 1 ? "idle" : "unknown" }));
  return fakeCli("herdr", {
    "workspace list": { result: { workspaces: [{ workspace_id: "w1", label: "api", tab_count: 1, pane_count: count }] } },
    "pane list": { result: { panes } },
    "tab list": { result: { tabs: [{ tab_id: "w1:t1", label: "main" }] } },
    "pane layout": { result: { layout: { panes: panes.map((p, i) => ({ pane_id: p.pane_id, rect: i === 0 ? { width, height, x: 0, y: 0 } : { width: 10, height: 10, x: 0, y: 0 } })) } } },
  });
}

test("where: TUI advice follows the pane size and the number of panes", { skip: !unix }, () => {
  const advice = (bin) => JSON.parse(run(where, ["--json"], cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HERDR_ENV: "1", HERDR_PANE_ID: "w1:p1" })).out);
  const wide = advice(tuiWithLayout(200, 50));
  assert.deepEqual(wide.pane.size, { width: 200, height: 50 });
  assert.deepEqual([wide.advice.open, wide.advice.direction, wide.advice.source], ["pane", "right", "layout"]);
  assert.deepEqual([advice(tuiWithLayout(120, 50)).advice.open, advice(tuiWithLayout(120, 50)).advice.direction], ["pane", "down"]);
  assert.equal(advice(tuiWithLayout(100, 30)).advice.open, "tab");
  const crowded = advice(tuiWithLayout(240, 60, 4));
  assert.equal(crowded.tab.panes, 4);
  assert.equal(crowded.advice.open, "tab");
  assert.deepEqual(crowded.neighbors.map((n) => [n.id, n.agent, n.status]), [["w1:p2", "codex", "idle"], ["w1:p3", null, "unknown"], ["w1:p4", null, "unknown"]]);
});

test("where: the preference file overrides the layout advice", { skip: !unix }, () => {
  const dir = mkdtempSync(join(tmpdir(), "herdrfy-config-"));
  const config = join(dir, "config.json");
  writeFileSync(config, '{"open":"tab"}');
  const env = cleanEnv({ PATH: `${tuiWithLayout(200, 50)}:/usr/bin:/bin`, HERDR_ENV: "1", HERDR_PANE_ID: "w1:p1", HERDRFY_CONFIG: config });
  const data = JSON.parse(run(where, ["--json"], env).out);
  assert.deepEqual([data.preference.open, data.advice.open, data.advice.source], ["tab", "tab", "preference"]);
  writeFileSync(config, '{"open":"window"}');
  const bad = JSON.parse(run(where, ["--json"], env).out);
  assert.equal(bad.preference.open, "auto");
  assert.match(bad.preference.error, /invalid open value/u);
  assert.equal(bad.advice.source, "layout");
});

test("where: desktop tab with three terminals advises a new tab", { skip: !unix }, () => {
  const labels = { "herdr.space": "sp1", "herdr.tab": "tb1", where: "api / docs" };
  const bin = fakeCli("hc", {
    "get t1": { address: "t1", cwd: "/work", labels, state: "live" },
    ls: { terminals: [{ address: "t1" }, { address: "t2" }, { address: "t3" }] },
  });
  const data = JSON.parse(run(where, ["--json"], cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HC_TERMINAL_ID: "t1" })).out);
  assert.equal(data.advice.open, "tab");
  assert.match(data.advice.reason, /already shows 3 terminals/u);
});

test("where: the agent comes from the process tree, with its permission flag", { skip: !unix }, () => {
  const bin = fakeCli("hc", { "get t1": { address: "t1", cwd: "/work", labels: {}, state: "live", status: { app: "claude-code" } } });
  const proc = fakeProc({
    900: ["zsh", 901],
    901: ["claude", 902, ["claude", "--permission-mode=auto", "--dangerously-skip-permissions"]],
    902: ["zsh", 903],
    903: ["herdr-core", 1],
  });
  const env = cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HC_TERMINAL_ID: "t1", HERDRFY_PROC_ROOT: proc, HERDRFY_PID: "900" });
  const data = JSON.parse(run(where, ["--json"], env).out);
  assert.deepEqual(data.agent, { name: "claude", source: "process", pid: 901, permissions: true });
  assert.match(run(where, [], env).out, /^Agent: +claude \(from process, permissions skipped\)/mu);
  const noFlag = fakeProc({ 910: ["sh", 911], 911: ["node", 912, ["node", "/usr/lib/node_modules/codex/bin/codex"]], 912: ["herdr-core", 1] });
  const plain = JSON.parse(run(where, ["--json"], { ...env, HERDRFY_PROC_ROOT: noFlag, HERDRFY_PID: "910" }).out);
  assert.deepEqual([plain.agent.name, plain.agent.permissions], ["codex", false]);
  // Without the tree, the program Herdr reports names the agent.
  const reported = JSON.parse(run(where, ["--json"], cleanEnv({ PATH: `${bin}:/usr/bin:/bin`, HC_TERMINAL_ID: "t1" })).out);
  assert.deepEqual([reported.agent.name, reported.agent.source], ["claude", "herdr"]);
});

test("doctor: answers JSON with the expected sections", () => {
  const r = run(doctor, ["--json"]);
  assert.equal(r.code, 0);
  const data = JSON.parse(r.out);
  for (const key of ["environment", "binaries", "servers", "integrations", "skills", "templates", "agents", "config", "pending"]) {
    assert.ok(key in data, `missing ${key}`);
  }
});
