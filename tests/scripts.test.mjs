/**
 * Arquivo: tests/scripts.test.mjs
 * Descrição: Testes dos scripts da skill que não dependem de um Herdr em
 * execução: o bloco de instruções (criar, atualizar, conferir, remover) e o
 * localizador fora do Herdr.
 * Uso: `npm test` (node --test).
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { lstatSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const scripts = resolve(dirname(fileURLToPath(import.meta.url)), "..", "skills", "herdrfy", "scripts");
const instrucoes = join(scripts, "instrucoes.mjs");
const onde = join(scripts, "onde.mjs");

/** Roda um script e devolve código de saída e saída padrão. */
function rodar(script, args, env = process.env) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: "utf8", env });
  return { codigo: r.status, saida: r.stdout, erro: r.stderr };
}

test("instrucoes: cria AGENTS.md e CLAUDE.md num projeto vazio", () => {
  const pasta = mkdtempSync(join(tmpdir(), "herdrfy-"));
  assert.equal(rodar(instrucoes, ["--projeto", pasta, "--check"]).codigo, 1);
  assert.equal(rodar(instrucoes, ["--projeto", pasta]).codigo, 0);
  const agents = readFileSync(join(pasta, "AGENTS.md"), "utf8");
  assert.match(agents, /<!-- herdrfy:inicio -->/u);
  assert.match(agents, /claude --permission-mode=auto --dangerously-skip-permissions/u);
  assert.match(agents, /codex --yolo --no-daemon/u);
  assert.match(agents, /opencode --auto/u);
  assert.match(agents, /onde\.mjs --superficie/u);
  assert.doesNotMatch(agents, /\{\{ONDE\}\}/u);
  // CLAUDE.md nasce como link ou como arquivo com o mesmo bloco.
  assert.match(readFileSync(join(pasta, "CLAUDE.md"), "utf8"), /herdrfy:inicio/u);
  assert.equal(rodar(instrucoes, ["--projeto", pasta, "--check"]).codigo, 0);
});

test("instrucoes: preserva o texto existente e não duplica o bloco", () => {
  const pasta = mkdtempSync(join(tmpdir(), "herdrfy-"));
  writeFileSync(join(pasta, "AGENTS.md"), "# Projeto\n\nRegra própria.\n");
  writeFileSync(join(pasta, "CLAUDE.md"), "# Claude\n");
  rodar(instrucoes, ["--projeto", pasta]);
  rodar(instrucoes, ["--projeto", pasta]);
  for (const nome of ["AGENTS.md", "CLAUDE.md"]) {
    const texto = readFileSync(join(pasta, nome), "utf8");
    assert.equal(texto.split("<!-- herdrfy:inicio -->").length, 2, `${nome} tem um bloco só`);
    assert.equal(lstatSync(join(pasta, nome)).isSymbolicLink(), false);
  }
  assert.match(readFileSync(join(pasta, "AGENTS.md"), "utf8"), /^# Projeto\n\nRegra própria\.\n/u);
});

test("instrucoes: troca um bloco antigo pelo atual", () => {
  const pasta = mkdtempSync(join(tmpdir(), "herdrfy-"));
  writeFileSync(join(pasta, "AGENTS.md"), "antes\n\n<!-- herdrfy:inicio -->\nvelho\n<!-- herdrfy:fim -->\n\ndepois\n");
  assert.equal(rodar(instrucoes, ["--arquivo", join(pasta, "AGENTS.md"), "--check"]).codigo, 1);
  rodar(instrucoes, ["--arquivo", join(pasta, "AGENTS.md")]);
  const texto = readFileSync(join(pasta, "AGENTS.md"), "utf8");
  assert.doesNotMatch(texto, /velho/u);
  assert.match(texto, /^antes\n/u);
  assert.match(texto, /\ndepois\n$/u);
});

test("instrucoes: --remover devolve o arquivo ao texto original", () => {
  const pasta = mkdtempSync(join(tmpdir(), "herdrfy-"));
  const original = "# Projeto\n\nRegra própria.\n";
  writeFileSync(join(pasta, "AGENTS.md"), original);
  writeFileSync(join(pasta, "CLAUDE.md"), original);
  rodar(instrucoes, ["--projeto", pasta]);
  rodar(instrucoes, ["--projeto", pasta, "--remover"]);
  assert.equal(readFileSync(join(pasta, "AGENTS.md"), "utf8"), original);
  assert.equal(readFileSync(join(pasta, "CLAUDE.md"), "utf8"), original);
});

test("instrucoes: argumento desconhecido sai com 2", () => {
  assert.equal(rodar(instrucoes, ["--nao-existe"]).codigo, 2);
});

test("onde: fora do Herdr responde superficie nula com código 0", () => {
  const env = { ...process.env };
  for (const chave of Object.keys(env)) if (chave.startsWith("HC_") || chave.startsWith("HERDR_")) delete env[chave];
  const r = rodar(onde, ["--json"], env);
  assert.equal(r.codigo, 0);
  assert.deepEqual(JSON.parse(r.saida), { superficie: null, encontrado: false });
});

test("onde: superfície inválida sai com 2", () => {
  assert.equal(rodar(onde, ["--superficie", "janela"]).codigo, 2);
});

test("diagnostico: responde JSON com as seções esperadas", () => {
  const saida = execFileSync(process.execPath, [join(scripts, "diagnostico.mjs"), "--json"], { encoding: "utf8" });
  const dados = JSON.parse(saida);
  for (const chave of ["ambiente", "binarios", "servidores", "integracoes", "skills", "templates", "agentes", "configuracao", "pendencias"]) {
    assert.ok(chave in dados, `falta ${chave}`);
  }
});

test("instrucoes: avisa quando o arquivo manda iniciar agentes por alias", () => {
  const pasta = mkdtempSync(join(tmpdir(), "herdrfy-"));
  writeFileSync(join(pasta, "AGENTS.md"), "# Projeto\n\nUse `zsh -ic cx` para abrir o Codex.\n");
  const r = rodar(instrucoes, ["--arquivo", join(pasta, "AGENTS.md"), "--json"]);
  assert.deepEqual(JSON.parse(r.saida).arquivos[0].conflitos, [3]);
  // O bloco cita cc, cx e oc como exemplo do que não usar; não conta.
  writeFileSync(join(pasta, "AGENTS.md"), "# Projeto\n");
  const limpo = rodar(instrucoes, ["--arquivo", join(pasta, "AGENTS.md"), "--json"]);
  assert.equal(JSON.parse(limpo.saida).arquivos[0].conflitos, undefined);
});
