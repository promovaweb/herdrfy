# Superfícies e localização

O Herdr tem dois produtos com comandos diferentes. A skill trata cada um como
uma superfície.

| | Herdr TUI | Herdr Desktop |
| --- | --- | --- |
| O que é | multiplexador dentro de um terminal | aplicativo de janela |
| Quem mantém os terminais | servidor do `herdr` | herdr-core (`hc`) |
| Hierarquia | sessão, workspace, aba, painel | máquina, espaço, aba, painel, terminal |
| Endereços | `w1`, `w1:t1`, `w1:p1` | terminal `t7` ou `maquina/t7`; espaço `sp<32 hex>`; aba `tb<32 hex>` |
| Comando de controle | `herdr` | `hc` para terminais e agentes; `herdr-app` para a janela |
| Sinal no ambiente | `HERDR_ENV=1` | `HC_TERMINAL_ID=<endereço>` |
| Estado do agente | detectado pela tela e pelas integrações | informado pelo próprio programa (OSC 7501) |
| Manual embutido | `herdr --skill` | `hc --skill` e `herdr-app --skill` |

O herdr-core também roda sem janela, num servidor, e atende outros clientes
além da janela do Desktop. Em todos esses casos a superfície continua sendo
"Desktop" para esta skill: os comandos são os do `hc`, descritos em
[herdr-core.md](herdr-core.md).

## Quem define a superfície

Rode o localizador sem opções: ele detecta a superfície pelo ambiente. A
ordem de detecção é:

1. `HC_TERMINAL_ID` presente: Desktop. Vence sempre, porque um terminal do
   herdr-core pode herdar `HERDR_ENV=1` e IDs de um Herdr TUI que rodava
   antes na mesma máquina.
2. `HERDR_ENV=1` sem `HC_TERMINAL_ID`: TUI.
3. Nenhum dos dois: fora do Herdr.

Quando a pessoa informar ("estou no TUI", "estou no Desktop"), a palavra dela
vale mais que a detecção: passe com `--surface`. O script aceita os
sinônimos `core` e `hc` para `desktop`, e `herdr` para `tui`.

Pergunte uma vez na sessão quando a resposta for `Outside Herdr` e o pedido
envolver o Herdr, ou quando a pessoa citar uma superfície diferente da
detectada. Depois da resposta, não pergunte de novo.

## Localizador

```bash
node <skill>/scripts/where.mjs                     # detecta a superfície
node <skill>/scripts/where.mjs --surface desktop   # ou tui, quando a pessoa informou
node <skill>/scripts/where.mjs --json              # para ler por script
node <skill>/scripts/where.mjs --help
```

Os scripts da skill escrevem a saída e as chaves do JSON em inglês. Códigos
de saída: `0` respondeu, `1` não conseguiu ler o Herdr, `2` argumento
inválido.

### Resposta no Desktop

```json
{
  "surface": "desktop",
  "found": true,
  "cli": "hc",
  "window": { "cli": "herdr-app", "available": false },
  "terminal": {
    "id": "t1s",
    "name": null,
    "where": "promovaweb / docs",
    "space": "sp8ecd504c8ef5fec59681282f5b26d8c8",
    "tab": "tb7ec6e34ffe93cd49a498cc401f4596ab",
    "placement": "tab",
    "identity": "ghostty",
    "cwd": "/home/ana/projeto",
    "program": "claude-code",
    "state": "live",
    "status": "working",
    "parent": null
  },
  "neighbors": [{ "id": "t16", "program": "codex", "status": "idle" }]
}
```

- `terminal.id` é o seu endereço. Passe-o aos agentes que você abrir, para
  eles avisarem com `hc send`.
- `terminal.space` e `terminal.tab` são os valores dos rótulos `herdr.space`
  e `herdr.tab`. Repita os dois em todo terminal novo que deva aparecer na
  sua aba.
- `where` é o rótulo legível "espaço / aba" escrito por quem mostra o
  terminal.
- `terminal.placement` resume os três casos de posição, descritos abaixo.
- `terminal.identity` repete o campo `identity` do `hc get`. No `hc`
  0.1.19, os terminais da janela trazem `ghostty` e um terminal sem rótulos
  de aba trouxe `herdr-mobile`. O manual do `hc` não descreve o campo:
  use-o como pista para o relato, não como regra.
- `neighbors` lista os outros terminais da mesma aba.
- `window.available` diz se o `herdr-app` existe nesta máquina. Quando a
  janela roda em outro computador, ele não existe aqui e a aba ou o painel
  sai pelos rótulos do `hc`.
- `found: false`: este processo não é um terminal do core. A lista
  `neighbors` traz todos os terminais vivos para você operar por endereço.

### Os três casos de `placement`

| `placement` | Rótulos do terminal | Como abrir um painel novo |
| --- | --- | --- |
| `tab` | `herdr.space` e `herdr.tab` presentes | repita os dois rótulos; o painel entra na sua aba |
| `unlabeled` | `where` presente, sem `herdr.space` e `herdr.tab` | não existe aba para repetir; siga [desktop.md](desktop.md#terminal-sem-rótulos-de-aba) |
| `none` | nenhum dos três | o terminal está fora da janela; siga a mesma seção |

O caso `unlabeled` foi visto num terminal com `identity: herdr-mobile`: ele
é mostrado com um nome de espaço e aba, mas não carrega os IDs que a janela
usa para encaixar painéis. Não invente os rótulos a partir do texto de
`where`.

### Resposta no TUI

```json
{
  "surface": "tui",
  "found": true,
  "cli": "herdr",
  "workspace": { "id": "w1", "label": "api" },
  "tab": { "id": "w1:t2", "label": "agentes" },
  "pane": { "id": "w1:p5", "cwd": "/home/ana/api", "agent": "claude" },
  "envCurrent": true,
  "method": "processes",
  "workspaces": [{ "id": "w1", "label": "api", "tabs": 2, "panes": 4 }]
}
```

- `pane.id` é o seu painel. Use-o como alvo explícito de `pane split` e
  `pane layout`.
- `method: "processes"` significa que o painel foi achado pelo shell do
  próprio processo. `method: "env"` significa que o script caiu nas
  variáveis de ambiente, sem conferir; trate a posição como provável e
  confirme com `herdr pane get <id>`.
- `envCurrent: false` avisa que `HERDR_PANE_ID` aponta para um ID antigo.
  Use o ID devolvido.
- `found: false`: este processo não roda num painel da sessão padrão. Opere
  só com IDs explícitos lidos de `workspaces`, `herdr pane list` e
  `herdr agent list`, sem `--current`, e diga isso à pessoa antes de abrir
  painéis.

## Depois de mudar de lugar

Um painel do TUI movido para outro workspace recebe ID novo. Um terminal do
Desktop levado para outra aba troca o rótulo `herdr.tab`. Rode o localizador
de novo depois de `herdr pane move`, depois que a pessoa disser que moveu a
aba, e no começo de cada sessão retomada.

## Sessões e máquinas

- TUI: sessões nomeadas são servidores separados. `herdr session list` mostra
  quais rodam. Sem `--session`, os comandos falam com a sessão do painel.
  Máquinas salvas usam o prefixo `herdr --machine <rótulo> ...`, e os IDs
  valem só dentro daquela máquina.
- Desktop: `hc machine ls` lista as máquinas. Um terminal remoto tem endereço
  `maquina/t7`; use o endereço inteiro em todos os comandos.
