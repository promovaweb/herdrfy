# Localização

Antes de abrir qualquer coisa, o agente precisa saber onde está. O
localizador responde isso.

```bash
node scripts/onde.mjs --superficie desktop
node scripts/onde.mjs --superficie tui
node scripts/onde.mjs --json
```

## No Desktop

```text
Superfície: Herdr Desktop / herdr-core (use hc, não herdr)
Janela:     herdr-app ausente nesta máquina; abas e painéis saem por rótulos do hc
Terminal:   t1s em promovaweb / docs
Espaço:     sp8ecd504c8ef5fec59681282f5b26d8c8
Aba:        tb7ec6e34ffe93cd49a498cc401f4596ab
Pasta:      /home/ana/projeto
Programa:   claude-code (working)
Vizinho:    t16 codex (idle) em promovaweb / docs
```

- **Terminal** é o endereço do agente. Outros agentes usam esse endereço
  para avisar quando terminam.
- **Espaço** e **Aba** são os identificadores que o agente repete para abrir
  um painel na mesma aba.
- **Vizinho** lista os outros terminais da aba.

## No TUI

```text
Superfície: Herdr TUI (use herdr, não hc)
Workspace:  api (w1)
Aba:        agentes (w1:t2)
Painel:     w1:p5 com claude
Pasta:      /home/ana/api
```

O Herdr TUI grava a posição do painel em variáveis de ambiente quando o
painel nasce. Se você mover o painel para outra aba ou workspace, as
variáveis continuam com o valor antigo. O localizador não confia nelas: ele
sobe a árvore de processos até o servidor do Herdr e procura o painel pelo
shell. Quando as variáveis estão velhas, a resposta traz um aviso com o ID
certo.

## Quando o agente não está na superfície

Se a resposta disser que o processo não é um terminal do core, ou que não
roda num painel da sessão, o agente está fora daquela superfície. Ele ainda
consegue operar por endereço, mas avisa você antes de abrir painéis, porque
não existe "a mesma aba" de referência.

## Depois de mover

Moveu o painel ou a aba? Diga ao agente. Ele roda o localizador de novo
antes do próximo comando.
