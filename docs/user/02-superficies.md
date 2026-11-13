# Superfícies

O Herdr tem dois produtos, e cada um tem o seu comando. O Herdrfy chama cada
produto de superfície.

| | Herdr TUI | Herdr Desktop |
| --- | --- | --- |
| Onde roda | dentro de um terminal | numa janela própria |
| Organização | workspaces, abas e painéis | espaços, abas e painéis |
| Comando | `herdr` | `hc` (terminais e agentes) e `herdr-app` (janela) |
| Quem mantém os terminais | o servidor do `herdr` | o herdr-core |

## Informe a sua

O agente detecta a superfície pela árvore de processos do terminal e, quando
ela não basta, pelo ambiente. Você pode dizer no pedido "estou no TUI" ou
"estou no Desktop": a sua frase vale mais que a detecção. Quando a detecção
falha ou contraria o pedido, ele pergunta uma vez e guarda a resposta pelo
resto da sessão.

## Por que informar

Um terminal pode carregar sinais das duas superfícies ao mesmo tempo. Isso
acontece, por exemplo, quando o herdr-core foi iniciado de dentro de um
painel do Herdr TUI: os terminais novos herdam `HERDR_ENV=1` e os endereços
antigos (`HERDR_WORKSPACE_ID`, `HERDR_TAB_ID`, `HERDR_PANE_ID`). Com o
servidor do TUI rodando na mesma máquina, um comando `herdr` disparado dali
funciona e cria a aba no TUI, embora a pessoa esteja olhando a janela do
Desktop. É o caso que já apareceu: a pessoa pediu uma aba no Desktop e ela
abriu no TUI.

Por isso o agente decide a superfície pela árvore de processos, não pelas
variáveis. Ele sobe do próprio processo até o ancestral mais próximo:
processo `herdr-core` é Desktop, processo `herdr` é TUI. As variáveis só
decidem quando a árvore não tem nenhuma das duas. A resposta do localizador
mostra os dois lados no objeto `detection` e avisa com `Warning:` quando as
variáveis da outra superfície estão herdadas.

A sua informação continua valendo mais que qualquer detecção. Quando ela
contraria a árvore de processos, o localizador mantém a superfície que você
disse, marca `mismatch: true` e avisa que os comandos dela não chegam onde o
agente roda. Se isso acontecer, diga onde você está de fato.

## Terminal aberto fora da janela

Um terminal do herdr-core pode nascer fora da janela do Desktop: pelo
aplicativo móvel, por `hc run` num servidor ou como auxiliar de outro
agente. Esse terminal não pertence a uma aba da janela, mesmo quando aparece
com um nome de espaço e aba.

Nesse caso não existe "a mesma aba" para o Herdrfy repetir. O que o agente
abrir fica como auxiliar, acessível pelo endereço, e ele avisa você disso.
Para ver o auxiliar numa aba, peça uma aba nova.

## Janela em outro computador

É comum a janela do Herdr Desktop rodar no seu notebook e os terminais
rodarem num servidor. Nesse arranjo, o `herdr-app` não existe no servidor.
O Herdrfy continua funcionando: ele abre painéis, abas e espaços pelos
rótulos do `hc`, e a janela os mostra do mesmo jeito. Só o nome da aba e a
posição exata do painel ficam por conta da janela.
