# Herdr TUI

O Herdr TUI organiza terminais em workspaces, abas e painéis, reconhece os
agentes de código que rodam nos painéis e expõe tudo pelo comando `herdr`.

Antes de usar um grupo de comandos pela primeira vez na sessão, leia a ajuda
da versão instalada: `herdr --help` e `herdr <grupo>` sem subcomando
(`agent`, `pane`, `tab`, `workspace`, `worktree`, `session`, `integration`,
`machine`, `notification`, `terminal`).

Duas armadilhas da descoberta:

- `herdr` sem argumentos abre ou anexa a interface. Não rode para consultar.
- Um comando que altera algo roda com os valores padrão quando faltam
  argumentos. `herdr workspace create` sem nada cria um workspace. Não
  sonde comandos desse tipo.

## Conceitos e IDs

| Nível | ID | Papel |
| --- | --- | --- |
| Sessão | nome | servidor separado, com seus próprios workspaces |
| Workspace | `w1` | um projeto, uma tarefa |
| Aba | `w1:t1` | um arranjo de painéis dentro do workspace |
| Painel | `w1:p1` | um terminal real |
| Agente | nome ou ID do painel | o agente reconhecido que ocupa o painel |

- IDs fechados não são reaproveitados. Um painel movido para outro
  workspace recebe ID novo; continue com
  `.result.move_result.pane.pane_id`.
- Leia os IDs das respostas em JSON. Não deduza pela ordem da barra lateral.
- `workspace create` devolve `.result.workspace`, `.result.tab` e
  `.result.root_pane`. `tab create` devolve `.result.tab` e
  `.result.root_pane`. `pane split` devolve `.result.pane`.

## Painel na aba de quem pediu

Esta é a forma padrão. Veja a geometria do seu painel e divida o lado maior:

```bash
herdr pane layout --pane <seu-painel>
herdr pane split <seu-painel> --direction right --cwd "$PWD" --no-focus
```

Painel largo divide para `right`; painel estreito ou alto divide para
`down`. Evite repetir a mesma direção até sobrar coluna ou linha apertada
demais para ler. Respeite a direção que a pessoa pedir. `--no-focus` mantém o
foco com ela. O ID do painel novo vem em `.result.pane.pane_id`.

Use o ID devolvido pelo localizador como alvo. `--current` só é confiável
quando o localizador respondeu `envCurrent: true`.

## Aba e workspace novos, só a pedido

```bash
herdr tab create --workspace <workspace> --cwd <pasta> --label "logs" --no-focus
herdr workspace create --cwd <pasta> --label api --no-focus
herdr worktree create --workspace <workspace> --branch <nome> --no-focus
```

Cada criação já traz um painel raiz; use-o para o primeiro programa e só
divida se precisar de outro terminal.

## Agentes

Um painel existe com ou sem agente. `agent start` exige um painel no prompt
do shell e não cria, divide nem move painel.

```bash
herdr agent start revisor --kind claude --pane <painel> -- \
  --permission-mode=auto --dangerously-skip-permissions
herdr agent prompt revisor "Revise o diff atual; só achados acionáveis." \
  --wait --timeout 300000
herdr agent read revisor --source recent-unwrapped --lines 120
```

As flags de cada agente estão em [agentes.md](agentes.md).

- `agent start` volta quando o Herdr detecta o agente pronto no painel
  (limite padrão de 30 segundos). Se o agente parar num diálogo, a resposta
  é `agent_not_ready`; o nome continua valendo para `agent read` e
  `agent send-keys`.
- `agent prompt` envia o texto e o Enter como um envio só. Com `--wait`,
  espera o primeiro estado assentado: `idle`, `done` ou `blocked`.
- `agent_blocked`: o agente já esperava uma resposta; nada foi enviado. Leia
  a tela e leve a pergunta à pessoa.
- `agent_prompt_stalled` ou `timeout`: não provam que o texto não chegou.
  Leia antes de reenviar.
- `--until <estado>` só para espera específica, como
  `herdr agent wait revisor --until blocked --timeout 120000`.
- Os alvos aceitam o nome do agente ou o ID do painel que o hospeda. Um
  agente iniciado à mão é detectado sozinho; dê nome com
  `herdr agent rename <painel> <nome>`.

### Estados

| Estado | Significado |
| --- | --- |
| `working` | o agente está num turno |
| `idle` | pronto para receber texto |
| `done` | pronto, com um turno concluído que ninguém viu ainda |
| `blocked` | parado numa pergunta ou pedido de aprovação |
| `unknown` | há um agente, mas o Herdr não conseguiu classificar |

`idle` e `done` não garantem que um diálogo desconhecido foi reconhecido.
`unknown` não prova conclusão. Em caso de dúvida,
`herdr agent explain <alvo> --json` mostra por que o detector classificou o
painel daquele jeito.

## Programas comuns em painéis

```bash
herdr pane run <painel> "npm test"
herdr pane wait-output <painel> --match "passed" --timeout 120000
herdr pane wait-output <painel> --regex "passed|failed" --timeout 120000
herdr pane read <painel> --source recent-unwrapped --lines 120
herdr pane send-text <painel> "texto sem enter"
herdr pane send-keys <painel> ctrl+c
```

`pane run` confirma que o comando entrou na fila, não que rodou.
`pane wait-output` procura no que já está na tela, então um texto antigo
também casa; escolha um texto que só o resultado novo traz.

Fontes de leitura:

| `--source` | Conteúdo |
| --- | --- |
| `visible` | o que está na tela agora |
| `recent` | saída recente, com as quebras de linha da tela |
| `recent-unwrapped` | saída recente com as quebras desfeitas; melhor para logs e respostas |
| `detection` | o trecho que o detector de agentes lê |

`--format ansi` preserva cores quando elas importam. Agentes de tela cheia
guardam o histórico fora da rolagem do Herdr; se uma leitura maior não
trouxer a resposta inteira, peça ao agente para gravar a resposta num
arquivo Markdown numa pasta temporária e responder só com o caminho.

## Sessões e máquinas

```bash
herdr session list
herdr status
herdr machine list --json
herdr --machine <rótulo> agent list
herdr --machine <rótulo> agent prompt <nome> "..." --wait --timeout 120000
```

IDs e nomes valem dentro de um servidor. Com `--machine`, descubra os IDs
naquela máquina e mantenha o prefixo em todos os comandos seguintes; não
combine com `--session` nem `--remote`. `herdr machine reconnect` pede
autenticação SSH da pessoa: não rode por ela. Uma falha de conexão não prova
que a mudança não foi aplicada; consulte o estado remoto antes de repetir.

## Limites

- Não feche workspace, aba, painel ou sessão que você não criou.
  `workspace close --group` fecha também os workspaces de worktree ligados;
  não use para contornar um erro.
- Não rode `herdr server stop` numa sessão ativa sem pedido explícito. Para
  experimentos, use uma sessão nomeada própria.
- `--trust-repository` só depois que a pessoa conferiu o repositório.
- Erros do servidor saem em JSON no stderr com código 1. Erro de sintaxe do
  comando sai com código 2.
- Cliente e servidor podem ter versões diferentes depois de uma atualização:
  `herdr status` mostra as duas.
