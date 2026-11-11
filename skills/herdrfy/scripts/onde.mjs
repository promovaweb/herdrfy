#!/usr/bin/env node
/**
 * Arquivo: skills/herdrfy/scripts/onde.mjs
 * Descrição: Informa onde o agente atual roda no Herdr, em uma das duas
 * superfícies: Desktop (terminais do herdr-core, CLI `hc`) ou TUI (painéis do
 * Herdr, CLI `herdr`).
 *
 * Uso:
 *   node onde.mjs                        detecta a superfície
 *   node onde.mjs --superficie desktop   usa a superfície informada pela pessoa
 *   node onde.mjs --superficie tui
 *   node onde.mjs --json                 mesma resposta em JSON
 *
 * Detecção sem `--superficie`: `HC_TERMINAL_ID` indica um terminal do
 * herdr-core e vence sempre, porque terminais do core podem herdar
 * `HERDR_ENV=1` e IDs antigos de um Herdr TUI. Sem `HC_TERMINAL_ID`,
 * `HERDR_ENV=1` indica um painel do TUI.
 *
 * No TUI, as variáveis `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID` e `HERDR_PANE_ID`
 * ficam velhas quando o painel é movido. O script sobe a árvore de processos
 * até o servidor do Herdr, pega o shell filho direto dele e procura o painel
 * cujo `shell_pid` é esse shell. Sem `/proc`, usa as variáveis e avisa.
 *
 * Saída JSON:
 *   Desktop: { superficie: "desktop", encontrado, cli: "hc", janela: { cli,
 *     disponivel }, terminal: { id, nome, where, espaco, aba, pasta, programa,
 *     estado, status, pai }, vizinhos: [...] }
 *   TUI: { superficie: "tui", encontrado, cli: "herdr", workspace, aba,
 *     painel, variaveisAtualizadas, metodo, workspaces: [...] }
 *   Fora do Herdr: { superficie: null, encontrado: false }
 *
 * Códigos de saída: 0 quando respondeu (mesmo fora do Herdr), 1 quando a
 * leitura do Herdr falhou, 2 para argumento inválido.
 *
 * Dependências: Node.js 18 ou mais novo; `hc` ou `herdr` no PATH.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);
const json = args.includes("--json");

/** Lê o valor de `--superficie`, aceitando `--superficie=x` e `--superficie x`. */
function superficiePedida() {
  const comIgual = args.find((a) => a.startsWith("--superficie="));
  const indice = args.indexOf("--superficie");
  const valor = comIgual ? comIgual.split("=")[1] : indice >= 0 ? args[indice + 1] : undefined;
  if (valor === undefined) return undefined;
  const normal = valor.toLowerCase();
  if (normal === "desktop" || normal === "core" || normal === "hc") return "desktop";
  if (normal === "tui" || normal === "herdr") return "tui";
  console.error(`Superfície inválida: ${valor}. Use desktop ou tui.`);
  process.exit(2);
}

/** Executa um comando e devolve o texto da saída padrão. */
function rodar(comando, argumentos) {
  return execFileSync(comando, argumentos, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** Diz se um executável existe no PATH. */
function existeNoPath(comando) {
  try {
    rodar(process.platform === "win32" ? "where" : "which", [comando]);
    return true;
  } catch {
    return false;
  }
}

/** Executa um comando do Herdr TUI e devolve o `result` do JSON. */
function herdr(...argumentos) {
  return JSON.parse(rodar("herdr", argumentos)).result;
}

/** Resume um terminal do herdr-core no formato da saída. */
function resumirTerminal(t) {
  return {
    id: t.address,
    nome: t.name ?? null,
    where: t.labels?.where ?? t.where ?? null,
    espaco: t.labels?.["herdr.space"] ?? null,
    aba: t.labels?.["herdr.tab"] ?? null,
    pasta: t.foreground?.cwd ?? t.cwd ?? null,
    programa: t.status?.app ?? t.foreground?.name ?? t.agent ?? null,
    estado: t.state ?? null,
    status: typeof t.status === "string" ? t.status : (t.status?.state ?? null),
    pai: t.parent ?? null,
  };
}

/** Localiza o terminal no herdr-core e lista os vizinhos da mesma aba. */
function localizarNoDesktop() {
  const id = process.env.HC_TERMINAL_ID;
  const janela = { cli: "herdr-app", disponivel: existeNoPath("herdr-app") };
  if (!id) {
    // A pessoa informou Desktop, mas este processo não é um terminal do core.
    // Ainda dá para operar por endereço: a lista mostra os terminais vivos.
    const vivos = JSON.parse(rodar("hc", ["ls", "--json"])).terminals ?? [];
    return { superficie: "desktop", encontrado: false, cli: "hc", janela, terminal: null, vizinhos: vivos.map(resumirTerminal) };
  }
  const terminal = resumirTerminal(JSON.parse(rodar("hc", ["get", id, "--json"])));
  let vizinhos = [];
  if (terminal.aba) {
    const naAba = JSON.parse(rodar("hc", ["ls", "--json", "--label", `herdr.tab=${terminal.aba}`])).terminals ?? [];
    vizinhos = naAba.filter((t) => t.address !== terminal.id).map(resumirTerminal);
  }
  return { superficie: "desktop", encontrado: true, cli: "hc", janela, terminal, vizinhos };
}

/** Lê o nome e o PID do pai de um processo em /proc. */
function processo(pid) {
  const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
  // O nome fica entre parênteses e pode conter espaços; o PPID vem depois.
  const fim = stat.lastIndexOf(")");
  const nome = stat.slice(stat.indexOf("(") + 1, fim);
  const ppid = Number(stat.slice(fim + 2).split(" ")[1]);
  return { pid, nome, ppid };
}

/** Sobe a árvore até o servidor do Herdr e devolve o shell filho direto dele. */
function shellDoPainel() {
  if (!existsSync("/proc/self/stat")) return undefined;
  let atual = processo(process.pid);
  while (atual.ppid > 1) {
    const pai = processo(atual.ppid);
    if (pai.nome === "herdr") return atual.pid;
    atual = pai;
  }
  return undefined;
}

/** Localiza o painel no Herdr TUI pelo shell, com as variáveis como reserva. */
function localizarNoTui() {
  const workspaces = herdr("workspace", "list").workspaces;
  const paineis = workspaces.flatMap((w) => herdr("pane", "list", "--workspace", w.workspace_id).panes);
  const resumoWorkspaces = workspaces.map((w) => ({ id: w.workspace_id, rotulo: w.label, abas: w.tab_count, paineis: w.pane_count }));
  const shell = shellDoPainel();
  let painel;
  let metodo = "processos";
  if (shell !== undefined) {
    // Confere primeiro o painel das variáveis, que costuma estar certo.
    const ordem = [...paineis].sort((a, b) => Number(b.pane_id === process.env.HERDR_PANE_ID) - Number(a.pane_id === process.env.HERDR_PANE_ID));
    painel = ordem.find((item) => {
      try {
        return herdr("pane", "process-info", "--pane", item.pane_id).process_info.shell_pid === shell;
      } catch {
        return false;
      }
    });
  }
  if (!painel) {
    metodo = "variaveis";
    painel = paineis.find((item) => item.pane_id === process.env.HERDR_PANE_ID);
  }
  if (!painel) {
    // Este processo não roda num painel desta sessão do TUI. A lista de
    // workspaces permite operar por ID explícito, sem `--current`.
    return { superficie: "tui", encontrado: false, cli: "herdr", workspace: null, aba: null, painel: null, variaveisAtualizadas: false, metodo: null, workspaces: resumoWorkspaces };
  }
  const workspace = workspaces.find((w) => w.workspace_id === painel.workspace_id);
  const aba = herdr("tab", "list", "--workspace", painel.workspace_id).tabs.find((t) => t.tab_id === painel.tab_id);
  return {
    superficie: "tui",
    encontrado: true,
    cli: "herdr",
    workspace: { id: painel.workspace_id, rotulo: workspace?.label ?? null },
    aba: { id: painel.tab_id, rotulo: aba?.label ?? null },
    painel: { id: painel.pane_id, pasta: painel.foreground_cwd ?? painel.cwd ?? null, agente: painel.agent ?? null },
    variaveisAtualizadas: process.env.HERDR_PANE_ID === painel.pane_id,
    metodo,
    workspaces: resumoWorkspaces,
  };
}

/** Imprime a resposta em texto legível ou em JSON. */
function imprimir(dados) {
  if (json) {
    console.log(JSON.stringify(dados, null, 2));
    return;
  }
  if (!dados.superficie) {
    console.log("Fora do Herdr: este agente não roda num terminal do herdr-core nem num painel do Herdr TUI.");
    return;
  }
  if (dados.superficie === "desktop") {
    console.log("Superfície: Herdr Desktop / herdr-core (use hc, não herdr)");
    console.log(`Janela:     herdr-app ${dados.janela.disponivel ? "disponível nesta máquina" : "ausente nesta máquina; abas e painéis saem por rótulos do hc"}`);
    if (!dados.encontrado) {
      console.log("Terminal:   este processo não é um terminal do core; opere pelos endereços abaixo.");
    } else {
      const t = dados.terminal;
      console.log(`Terminal:   ${t.id}${t.nome ? ` (${t.nome})` : ""}${t.where ? ` em ${t.where}` : ""}`);
      console.log(`Espaço:     ${t.espaco ?? "sem rótulo herdr.space (terminal fora da janela)"}`);
      console.log(`Aba:        ${t.aba ?? "sem rótulo herdr.tab"}`);
      console.log(`Pasta:      ${t.pasta}`);
      if (t.programa) console.log(`Programa:   ${t.programa}${t.status ? ` (${t.status})` : ""}`);
      if (t.pai) console.log(`Pai:        ${t.pai}`);
    }
    for (const v of dados.vizinhos) {
      console.log(`Vizinho:    ${v.id}${v.nome ? ` (${v.nome})` : ""} ${v.programa ?? ""}${v.status ? ` (${v.status})` : ""}${v.where ? ` em ${v.where}` : ""}`.trimEnd());
    }
    return;
  }
  console.log("Superfície: Herdr TUI (use herdr, não hc)");
  if (!dados.encontrado) {
    console.log("Painel:     este processo não roda num painel desta sessão; opere por IDs explícitos, sem --current.");
    for (const w of dados.workspaces) console.log(`Workspace:  ${w.rotulo} (${w.id}), ${w.abas} aba(s), ${w.paineis} painel(éis)`);
    return;
  }
  console.log(`Workspace:  ${dados.workspace.rotulo} (${dados.workspace.id})`);
  console.log(`Aba:        ${dados.aba.rotulo ?? "sem nome"} (${dados.aba.id})`);
  console.log(`Painel:     ${dados.painel.id}${dados.painel.agente ? ` com ${dados.painel.agente}` : ""}`);
  console.log(`Pasta:      ${dados.painel.pasta}`);
  if (!dados.variaveisAtualizadas) {
    console.log(`Aviso: HERDR_PANE_ID=${process.env.HERDR_PANE_ID ?? "vazio"} está desatualizado; use ${dados.painel.id}.`);
  }
  if (dados.metodo === "variaveis") console.log("Aviso: localização tirada das variáveis de ambiente, sem conferir os processos.");
}

function main() {
  const pedida = superficiePedida();
  const superficie = pedida ?? (process.env.HC_TERMINAL_ID ? "desktop" : process.env.HERDR_ENV === "1" ? "tui" : null);
  if (superficie === "desktop") return imprimir(localizarNoDesktop());
  if (superficie === "tui") return imprimir(localizarNoTui());
  imprimir({ superficie: null, encontrado: false });
}

try {
  main();
} catch (erro) {
  const detalhe = erro instanceof Error ? erro.message.split("\n")[0] : String(erro);
  console.error(`Não foi possível consultar o Herdr: ${detalhe}`);
  process.exitCode = 1;
}
