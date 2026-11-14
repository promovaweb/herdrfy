# Localização

Antes de abrir qualquer coisa, o agente precisa saber onde está. O
localizador responde isso.

```bash
node ~/.agents/skills/herdrfy/scripts/where.mjs                     # detecta a superfície
node ~/.agents/skills/herdrfy/scripts/where.mjs --surface desktop   # ou tui
node ~/.agents/skills/herdrfy/scripts/where.mjs --json
```

A saída vem em inglês.

## No Desktop

```text
Surface:   Herdr Desktop / herdr-core (use hc, not herdr)
Window:    herdr-app not on this machine; tabs and panes go through hc labels
Terminal:  t1s in promovaweb / docs
Space:     sp8ecd504c8ef5fec59681282f5b26d8c8
Tab:       tb7ec6e34ffe93cd49a498cc401f4596ab
Identity:  ghostty
Folder:    /home/ana/projeto
Program:   claude-code (working)
Neighbor:  t16 codex (idle) in promovaweb / docs
```

- **Terminal** é o endereço do agente. Outros agentes usam esse endereço
  para avisar quando terminam.
- **Space** e **Tab** são os identificadores que o agente repete para abrir
  um painel na mesma aba.
- **Neighbor** lista os outros terminais da aba.

Quando o terminal não pertence a uma aba da janela, as linhas `Space` e
`Tab` dão lugar a uma linha `Placement`:

```text
Terminal:  t26 in herdrfy / main
Placement: shown as "herdrfy / main" but without herdr.space and herdr.tab labels; there is no tab to repeat
Identity:  herdr-mobile
```

Nesse caso o agente abre o que você solicitar como auxiliar (sem painel) e avisa você disso
(ver [Superfícies](02-superficies.md#terminal-aberto-fora-da-janela)).

## No TUI

```text
Surface:   Herdr TUI (use herdr, not hc)
Workspace: api (w1)
Tab:       agentes (w1:t2)
Pane:      w1:p5 running claude
Folder:    /home/ana/api
```

O Herdr TUI grava a posição do painel em variáveis de ambiente quando o
painel é criado. Quando o painel muda de aba ou de workspace, as variáveis
continuam com o valor antigo. O localizador não confia nelas: ele
sobe a árvore de processos até o servidor do Herdr e procura o painel pelo
shell. Quando as variáveis estão velhas, a resposta traz um aviso
(`Warning`) com o ID certo.

## Quando o agente não está na superfície

Se a resposta disser `this process is not a core terminal`, ou
`does not run in a pane of this session`, o agente está fora daquela
superfície. Ele ainda
consegue operar por endereço, mas avisa você antes de abrir painéis, porque
não existe "a mesma aba" de referência.

## Depois de mover

Depois de mover o painel ou a aba, avise o agente para que ele rode o
localizador de novo no próximo comando.
