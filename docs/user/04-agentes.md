# Agentes

## Permissões liberadas, sempre

O Herdrfy inicia todo agente pelo comando completo, com as flags que dispensam
as confirmações de permissão:

| Agente | Comando |
| --- | --- |
| Claude Code | `claude --permission-mode=auto --dangerously-skip-permissions` |
| Codex | `codex --yolo --no-daemon` |
| OpenCode | `opencode --auto` |

O comando vai escrito por extenso, sem alias de shell, para funcionar em
qualquer máquina e aparecer na lista de processos do terminal.

Nesse modo, o agente edita arquivos e roda comandos sem aguardar confirmação.
Use em máquinas e pastas onde isso é aceitável para você.

## A tarefa

Cada agente recebe uma tarefa escrita com: objetivo, arquivos e pastas do
escopo, se pode editar ou só ler, o que já foi conferido, a forma da
resposta e como avisar o fim. Quanto mais exata a sua instrução, mais exata a
tarefa que o seu agente escreve.

## Pasta nova

Na primeira vez numa pasta, Claude Code e Codex perguntam se você confia
nela, mesmo com as permissões liberadas. Quando a pasta é a da sua tarefa, o
Herdrfy aceita e segue. Para outra pasta, ele mostra a pergunta e espera a
sua resposta.

## Acompanhar

Enquanto os agentes trabalham, o seu agente segue com o trabalho dele. Para
saber como estão, ele usa os comandos de espera do Herdr e lê a tela de cada
um. Os estados que você vai ver:

| Estado | Significado |
| --- | --- |
| `working` | trabalhando |
| `idle` | parado, pronto para receber texto |
| `done` | terminou enquanto você olhava outra coisa |
| `blocked` | esperando você: uma pergunta ou uma confirmação de permissão |
| `error` | parou com erro (Desktop) |
| `unknown` | o Herdr não conseguiu classificar (TUI) |

Um agente em `blocked` aguarda a sua resposta. O Herdrfy lê a pergunta na tela
dele e traz o texto até você.

## Resultado

O seu agente lê a tela ou o arquivo do resultado antes de resumir. No
resumo, ele separa o que conferiu do que o outro agente apenas afirmou.

## Encerrar

Depois de aceitar o resultado, o agente encerra os auxiliares que abriu. Se
você quer manter um deles aberto, diga antes.
