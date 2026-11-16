# Painéis, abas e espaços

## Onde cada coisa abre

O que você disser decide. Sem indicação, o agente abre na mesma aba de onde
você deu a instrução, enquanto ela tiver espaço para mais um painel legível.
Quando não tiver, ele abre uma aba nova no mesmo espaço ou workspace e diz
por quê. Espaço ou workspace novo, só quando você pede.

| Você diz | O que acontece |
| --- | --- |
| "abra um agente ao lado" | painel novo na sua aba |
| "abra um terminal para os testes" | painel novo na sua aba, ou aba nova se a sua já estiver cheia |
| "abra numa aba nova" | aba nova no mesmo espaço ou workspace |
| "crie um espaço para o projeto X" | espaço novo (Desktop) ou workspace novo (TUI) |
| "rode isso em segundo plano" | no Desktop, um auxiliar sem painel; no TUI, um painel na sua aba |

## Quando a aba está cheia

O localizador mede a aba e responde no campo `advice` onde abrir o próximo
terminal:

- no TUI, o painel é dividido enquanto cada metade fica com 80 colunas ou
  mais (lado a lado) ou 20 linhas ou mais (um em cima do outro), e enquanto a
  aba tem menos de 4 painéis;
- no Desktop, a janela recebe mais um painel enquanto a aba mostra menos de
  3 terminais.

Abaixo disso, a tela de um agente quebra em linhas curtas e fica difícil de
ler, então o próximo terminal vai para uma aba nova.

## Sempre em aba, ou sempre na mesma aba

Para fixar a sua escolha, diga ao agente "sempre abra em aba nova" ou
"sempre na mesma aba". Ele oferece gravar a preferência em
`~/.config/herdrfy/config.json`, com `{"open":"tab"}` ou
`{"open":"pane"}`. `{"open":"auto"}`, ou apagar o arquivo, volta à medida da
aba. Um pedido seu numa tarefa continua valendo mais que a preferência.

## No Desktop

O agente abre o painel com o `hc`, repetindo os identificadores do espaço e
da aba dele. A janela encaixa o painel na aba. A posição (direita ou abaixo)
é escolhida pela janela; para definir a direção, o agente usa o `herdr-app`,
quando ele existe na máquina.

Um auxiliar aberto sem esses identificadores não ganha painel. Ele aparece
na lista de agentes, sob o agente que o abriu. Você pode clicar para espiar
ou transformá-lo em aba.

Quando o terminal do próprio agente não pertence a uma aba (aberto pelo
aplicativo móvel, por exemplo), tudo o que ele abre fica como auxiliar. Ele
avisa você e só cria uma aba quando você manda.

## No TUI

O agente olha o tamanho do painel dele e divide o lado que mantém as duas
metades legíveis: para a direita quando há largura, para baixo quando há
altura. O foco continua onde
você está.

## Foco

O Herdrfy não troca a aba que você está vendo nem tira o foco do seu painel,
a não ser que você peça para mostrar algo.

## Fechar

O agente fecha só o que abriu. Painéis, abas e espaços seus, ou de outros
agentes, ficam como estão.
