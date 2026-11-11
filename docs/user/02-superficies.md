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

O agente detecta a superfície pelo ambiente do terminal. Você pode dizer no
pedido "estou no TUI" ou "estou no Desktop": a sua frase vale mais que a
detecção. Quando a detecção falha ou contraria o pedido, ele pergunta uma vez
e guarda a resposta pelo resto da sessão.

## Por que informar

Um terminal pode carregar sinais das duas superfícies ao mesmo tempo. Isso
acontece, por exemplo, quando o herdr-core foi iniciado de dentro de um
painel do Herdr TUI: os terminais novos herdam as variáveis antigas. O
agente trata `HC_TERMINAL_ID` como sinal mais forte, mas a sua informação
vale mais que qualquer detecção.

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
