# Painéis, abas e espaços

## A regra

Tudo o que o agente abre aparece na mesma aba de onde você pediu. Aba,
espaço ou workspace novo, só quando você pede com essas palavras.

| Você pede | O que acontece |
| --- | --- |
| "abra um agente ao lado" | painel novo na sua aba |
| "abra um terminal para os testes" | painel novo na sua aba |
| "abra numa aba nova" | aba nova no mesmo espaço ou workspace |
| "crie um espaço para o projeto X" | espaço novo (Desktop) ou workspace novo (TUI) |
| "rode isso em segundo plano" | no Desktop, um auxiliar sem painel; no TUI, um painel na sua aba |

## No Desktop

O agente abre o painel com o `hc`, repetindo os identificadores do espaço e
da aba dele. A janela encaixa o painel na aba. A posição (direita ou abaixo)
é escolhida pela janela; para definir a direção, o agente usa o `herdr-app`,
quando ele existe na máquina.

Um auxiliar aberto sem esses identificadores não ganha painel. Ele aparece
na lista de agentes, sob o agente que o abriu. Você pode clicar para espiar
ou transformá-lo em aba.

## No TUI

O agente olha o tamanho do painel dele e divide o lado maior: painel largo
divide para a direita, painel alto divide para baixo. O foco continua onde
você está.

## Foco

O Herdrfy não troca a aba que você está vendo nem tira o foco do seu painel,
a não ser que você peça para mostrar algo.

## Fechar

O agente fecha só o que abriu. Painéis, abas e espaços seus, ou de outros
agentes, ficam como estão.
