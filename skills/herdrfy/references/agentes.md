# Agentes com as permissões liberadas

Todo agente que esta skill inicia sai pelo comando completo, com as flags que
dispensam os pedidos de aprovação. Sem alias de shell, sem `zsh -ic`, sem
comando encurtado. O comando escrito por extenso funciona em qualquer
máquina e fica registrado no `argv` do terminal, onde dá para conferir.

## Tabela de comandos

| Agente | Comando completo | Primeira tarefa no lançamento |
| --- | --- | --- |
| Claude Code | `claude --permission-mode=auto --dangerously-skip-permissions` | último argumento: `claude ... "tarefa"` |
| Codex | `codex --yolo --no-daemon` | último argumento: `codex ... "tarefa"` |
| OpenCode | `opencode --auto` | opção própria: `opencode --auto --prompt "tarefa"` |

No Codex, `--no-daemon` é obrigatório dentro do herdr-core: sem ele os
comandos do agente rodam num servidor de fundo, fora do terminal do `hc`. No
TUI a flag é opcional e pode ficar.

### Outros agentes

Para um agente fora da tabela, leia o `--help` dele antes de iniciar e use a
flag que libera as permissões. Flags conferidas nas versões atuais:

| Agente | Flag |
| --- | --- |
| Gemini CLI | `gemini --yolo` |
| GitHub Copilot CLI | `copilot --allow-all` |
| Kimi Code | `kimi --auto` |
| Hermes | `hermes --yolo` |

Se o `--help` não mostrar uma flag desse tipo, diga isso à pessoa e pergunte
como ela quer iniciar aquele agente. Não invente flag.

## Lançamento por superfície

### Desktop (`hc`)

```bash
hc run --bg --name <nome> --cwd <pasta> \
  --label herdr.space=<seu-espaço> --label herdr.tab=<sua-aba> \
  claude --permission-mode=auto --dangerously-skip-permissions "<tarefa>"

hc run --bg --name <nome> --cwd <pasta> \
  --label herdr.space=<seu-espaço> --label herdr.tab=<sua-aba> \
  codex --yolo --no-daemon "<tarefa>"

hc run --bg --name <nome> --cwd <pasta> \
  --label herdr.space=<seu-espaço> --label herdr.tab=<sua-aba> \
  opencode --auto --prompt "<tarefa>"
```

- `--bg` sempre. Sem ele, a tela inteira do agente entra na sua saída.
- Programa e argumentos vão separados, um por argumento. Uma única string
  entre aspas vira linha de shell; evite para agentes.
- Os dois `--label` põem o painel na sua aba. Sem eles o agente roda fora da
  janela e aparece só na lista de agentes, sob o seu terminal. Use essa forma
  para auxiliares que a pessoa não pediu para ver.
- Tire a tarefa do comando quando ela for longa ou tiver muitas aspas: inicie
  sem tarefa, espere o agente ficar pronto e envie com `hc send`. A tarefa
  passada no comando fica no `argv` e volta inteira na saída de `hc run`,
  `hc get` e `hc kill`.
- Sem `herdr-app` na máquina, a janela escolhe a posição e o tamanho do
  painel. Um painel estreito quebra a tela do agente em linhas curtas e
  atrapalha a leitura: peça o resultado em arquivo. Se a pessoa pediu uma
  direção ("ao lado", "embaixo"), diga no relato que a posição ficou por
  conta da janela.

Com templates instalados (ver [configuracao.md](configuracao.md)), o mesmo
lançamento fica:

```bash
hc run --bg --name <nome> --cwd <pasta> \
  --label herdr.space=<seu-espaço> --label herdr.tab=<sua-aba> \
  claude-yolo "<tarefa>"
```

O template guarda o comando com as flags e as instruções de abertura, e o
core entrega a tarefa depois que o agente informa que está pronto. Confira
`first_message.sent` na resposta: `false` significa que a tarefa não foi
entregue.

Quando o `herdr-app` existe na máquina e a pessoa pediu aba ou espaço novo,
o comando vai em JSON:

```bash
herdr-app do tab.new --name "revisão" \
  --argv '["claude","--permission-mode=auto","--dangerously-skip-permissions"]' \
  --task "<tarefa>"
```

### TUI (`herdr`)

```bash
herdr agent start <nome> --kind claude --pane <painel> -- \
  --permission-mode=auto --dangerously-skip-permissions
herdr agent start <nome> --kind codex --pane <painel> -- --yolo
herdr agent start <nome> --kind opencode --pane <painel> -- --auto
```

- `--kind` escolhe o executável; as flags vão depois de `--`.
- O painel precisa estar no prompt do shell, sem programa em primeiro plano.
- O nome segue o padrão `[a-z][a-z0-9_-]{0,31}` e é único entre os agentes
  vivos.
- A tarefa vai depois, com `herdr agent prompt <nome> "<tarefa>" --wait`.
- `agent start` não cria painel. Divida antes com `herdr pane split`.

## Diálogo de confiança da pasta

Numa pasta que o agente nunca abriu, Claude Code e Codex param numa pergunta
de confiança antes de qualquer tarefa, mesmo com as flags de permissão. O
herdr-core não recebe status nesse momento: `hc get <t>` mostra `status`
vazio e `hc wait <t>` volta por tempo esgotado.

| Agente | Tela | Aceitar |
| --- | --- | --- |
| Claude Code | "Is this a project you created or one you trust?", com "No, exit" marcado | `down` e `enter` |
| Codex | "Trust this folder?", com "Trust and continue" marcado | `enter` |
| OpenCode | não mostra esse diálogo | nada a responder |

```bash
hc read <t>                       # confirme qual diálogo está na tela
hc keys <t> down enter            # Claude Code
hc keys <t> enter                 # Codex
```

No TUI, as mesmas teclas vão por `herdr agent send-keys <nome> down enter`.

Aceite sem perguntar quando a pasta for a do pedido: o projeto atual, ou a
pasta que a pessoa indicou. Para qualquer outra pasta, mostre o diálogo à
pessoa e espere a resposta. Leia a tela antes de mandar as teclas: as opções
mudam entre versões, e a tecla certa depende de qual linha está marcada.

Depois de aceitar, espere e leia de novo. A tarefa passada no lançamento
costuma rodar sozinha em seguida. Reenvie só quando o campo de entrada
estiver vazio e a tela não mostrar a tarefa nem uma resposta.

## Conferir que o agente subiu com as flags

```bash
hc get <t> --json                          # Desktop: argv e foreground.argv
herdr pane process-info --pane <painel>    # TUI: campo cmdline
```

`argv` é o comando do lançamento e `foreground.argv` é o programa que está
em primeiro plano agora. Os dois precisam mostrar o agente com as flags. Um
`argv` que começa por `zsh` ou `sh` indica lançamento por shell ou alias,
fora da regra desta skill; a exceção é o lançamento por template, que roda
o `command` do template pelo `sh`.

A tela ajuda como segunda conferência, em painel largo: o Claude Code mostra
"bypass permissions on", o Codex mostra "permissions: YOLO mode" e o
OpenCode mostra "auto" ao lado do modo. Em painel estreito esses textos
podem ficar cortados; vale o `argv`.

## O que as flags mudam

Com as permissões liberadas, o agente edita arquivos e roda comandos sem
pedir aprovação. Por isso cada tarefa precisa de escopo escrito: quais
arquivos ou pastas, se pode editar, se pode abrir outros agentes e como
avisar o fim. Perguntas que o agente ainda fizer (escolhas de produto,
dúvidas de escopo) continuam indo para a pessoa.
