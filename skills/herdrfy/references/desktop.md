# Herdr Desktop: janela, espaços, abas e painéis

No Desktop há dois comandos com papéis separados:

- `hc` (herdr-core) inicia, lê, conversa, espera e encerra terminais e
  agentes. Os terminais continuam vivos com a janela fechada. Os comandos
  dele estão em [herdr-core.md](herdr-core.md).
- `herdr-app` muda o que a janela mostra: espaços, abas, painéis, layouts.
  Ele só existe na máquina onde a janela roda.

Este arquivo cobre o lugar das coisas na janela. Antes de usar um comando
pela primeira vez na sessão, leia o manual da versão instalada: `hc --skill`
e, quando existir, `herdr-app --skill`. Para os argumentos exatos,
`hc <comando> --help` e `herdr-app commands`.

## Rótulos que a janela usa

| Rótulo | Papel |
| --- | --- |
| `herdr.space` | ID do espaço, `sp` mais 32 dígitos hexadecimais |
| `herdr.tab` | ID da aba, `tb` mais 32 dígitos hexadecimais |
| `where` | texto "espaço / aba", escrito por quem mostra o terminal |
| `herdr.seen`, `herdr.pinned` | controle da própria janela; não altere |

O localizador devolve os dois primeiros em `terminal.space` e
`terminal.tab`, e resume a situação em `terminal.placement`
(ver [superficies.md](superficies.md)).

## Painel na aba de quem pediu

Esta é a forma padrão de abrir qualquer coisa visível, quando o localizador
responde `placement: "tab"`. Repita os dois rótulos:

```bash
hc run --bg --name <nome> --cwd "$PWD" \
  --label herdr.space=<seu-espaço> --label herdr.tab=<sua-aba> \
  [programa e argumentos]
```

Sem programa, o terminal abre o shell da máquina. A janela encaixa o
terminal como painel novo na mesma aba. O terminal nasce como seu filho:
entra em `hc wait --children` e termina quando o seu programa terminar.
Acrescente `--outlive-parent` quando a pessoa quiser que o painel continue
depois que você sair, e `--keep` quando o painel deva ganhar um shell novo
se o programa for perdido. Terminais com os rótulos da janela podem aparecer
com `keep: true` em `hc get` mesmo sem a flag: a janela cuida dos painéis
que mostra.

A posição do painel dentro da aba (à direita ou abaixo) é escolhida pela
janela. Para escolher a direção, use o `herdr-app` na máquina da janela:

```bash
herdr-app ls                                   # IDs de espaços, abas e painéis
herdr-app do pane.split --direction right --pane <id-do-painel> \
  --argv '["claude","--permission-mode=auto","--dangerously-skip-permissions"]'
```

## Terminal sem rótulos de aba

Quando o localizador responde `placement: "unlabeled"` ou `"none"`, o seu
terminal não carrega `herdr.space` e `herdr.tab`, e não existe aba para
repetir. Isso acontece num terminal aberto fora da janela do Desktop, num
auxiliar sem painel e num core sem janela.

1. Não monte os rótulos a partir do texto de `where` nem copie os de outro
   terminal: o painel cairia na aba de outra pessoa ou de outro trabalho.
2. Abra o terminal novo sem rótulos. Ele nasce como seu filho e fica
   acessível por endereço (`hc read`, `hc attach`):

   ```bash
   hc run --bg --name <nome> --cwd "$PWD" [programa e argumentos]
   ```

3. Diga à pessoa, antes de seguir, que o seu terminal não tem aba e que o
   novo ficou como auxiliar, com o endereço dele.
4. Se ela pedir para ver o auxiliar numa aba, use um dos caminhos de "Aba
   nova e espaço novo", abaixo. Isso já é um pedido de aba nova.

## Aba nova e espaço novo, só a pedido

Com `herdr-app` na máquina:

```bash
herdr-app do tab.new --name "logs" --folder /caminho
herdr-app do tab.new --name "revisão" \
  --argv '["codex","--yolo","--no-daemon"]' --task "<tarefa>"
herdr-app do space.new --name api --folder /caminho/api
herdr-app do space.new --name "api remota" --machine vps --folder /srv/api
```

Dê nome a toda aba e a todo espaço novo. O comando responde com os IDs
criados ou com `{ "error": ... }` e código 1. Confirme com `herdr-app ls`.

Sem `herdr-app` (janela em outro computador, ligada a este core), os rótulos
do `hc` fazem o mesmo trabalho:

```bash
# Aba nova no seu espaço: um ID de aba que ainda não existe
ABA="tb$(node -e 'console.log(require("crypto").randomBytes(16).toString("hex"))')"
hc run --bg --name <nome> --cwd <pasta> \
  --label herdr.space=<seu-espaço> --label herdr.tab=$ABA [programa]

# Mais painéis nessa aba nova: repita o mesmo $ABA
hc run --bg --name <outro> --cwd <pasta> \
  --label herdr.space=<seu-espaço> --label herdr.tab=$ABA [programa]

# Espaço novo: um ID de espaço que ainda não existe
ESPACO="sp$(node -e 'console.log(require("crypto").randomBytes(16).toString("hex"))')"
hc run --bg --name <nome> --cwd <pasta> --label herdr.space=$ESPACO [programa]
```

- O formato é `tb` ou `sp` seguido de 32 dígitos hexadecimais.
- A janela reescreve o rótulo `where` com o nome final, por exemplo
  `api / 3`. Leia com `hc get <t>` para saber onde o terminal caiu.
- Um espaço sem nome leva o nome da pasta do primeiro terminal; uma aba sem
  nome leva o número. Renomear só pelo `herdr-app`
  (`tab.rename`, `space.rename`) ou pela pessoa na janela.
- Use `--outlive-parent` em abas e espaços que a pessoa pediu para manter.
- Sem `herdr.space` no seu terminal, a aba nova pede um espaço: crie um
  espaço novo ou pergunte à pessoa em qual espaço ela quer a aba.

## Auxiliar sem painel

Um terminal sem os rótulos `herdr.space` e `herdr.tab` não ganha painel. Ele
aparece na lista de agentes da janela, sob o terminal que o abriu, e a pessoa
pode espiar ou fixar como aba quando quiser. Use para trabalho de apoio que
ninguém pediu para ver:

```bash
hc run --bg --name <nome> --cwd <pasta> codex --yolo --no-daemon "<tarefa>"
```

Quando a pessoa pedir para ver um auxiliar que já roda, na máquina da janela:
`herdr-app do terminal.keep --terminal <t> --place right`.

## Limites da janela

- Não abra `herdr-app` sem argumentos para consultar: isso abre ou traz a
  janela para a frente. Use `herdr-app ls` e `herdr-app status`.
- Não pare nem reinicie o aplicativo da janela.
- Não mude o que a janela mostra sem pedido: foco, aba ativa e layout ficam
  com a pessoa.
- Layouts, teclas e mods da janela seguem `herdr-app --skill` e o guia
  instalado em `~/.config/herdr-app/AGENTS.md`.
