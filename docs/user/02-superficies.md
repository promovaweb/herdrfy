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

Diga no pedido: "estou no TUI" ou "estou no Desktop". Essa frase define
quais comandos o agente usa.

Se você não disser, o agente tenta detectar pelo ambiente do terminal. Na
dúvida, ele pergunta uma vez e guarda a resposta pelo resto da sessão.

## Por que informar

Um terminal pode carregar sinais das duas superfícies ao mesmo tempo. Isso
acontece, por exemplo, quando o herdr-core foi iniciado de dentro de um
painel do Herdr TUI: os terminais novos herdam as variáveis antigas. O
agente trata `HC_TERMINAL_ID` como sinal mais forte, mas a sua informação
vale mais que qualquer detecção.

## Janela em outro computador

É comum a janela do Herdr Desktop rodar no seu notebook e os terminais
rodarem num servidor. Nesse arranjo, o `herdr-app` não existe no servidor.
O Herdrfy continua funcionando: ele abre painéis, abas e espaços pelos
rótulos do `hc`, e a janela os mostra do mesmo jeito. Só o nome da aba e a
posição exata do painel ficam por conta da janela.
