# herdr-core (`hc`)

O herdr-core mantém programas e agentes vivos em terminais persistentes. O
comando dele é `hc`. Ele roda com a janela do Herdr Desktop, sem janela num
servidor, ou atendendo outro cliente; em todos os casos os comandos são os
mesmos. O `hc` não arruma janelas: espaços, abas e painéis visíveis ficam em
[desktop.md](desktop.md).

Antes do primeiro comando da sessão, leia o manual da versão instalada com
`hc --skill`. Para os argumentos exatos, `hc <comando> --help`; a lista de
comandos sai em `hc --help`. Este arquivo foi conferido no `hc` 0.1.19.

## Conceitos

- **Terminal**: um programa vivo no core, com endereço (`t7`, `t1b`) e, se
  você quiser, nome (`--name`, 1 a 32 caracteres de `a-z 0-9 - _`). Onde um
  comando pede `<t>`, vale o endereço, o nome ou `maquina/t7`.
- **Seu endereço**: `$HC_TERMINAL_ID`. Dentro de um terminal, `attach`,
  `read`, `get`, `kill`, `rm`, `wait` e `interrupt` sem alvo escolhem um
  terminal por conta própria; passe sempre o alvo.
- **Filho**: terminal aberto a partir de outro. Termina quando o pai termina,
  salvo `--outlive-parent`. `hc wait --children` cobre só os filhos.
  `--no-parent` abre sem pai, e `--parent <t>` escolhe outro.
- **Rótulos**: pares `chave=valor` no terminal (`--label` no lançamento,
  `hc label <t> chave=valor` depois; `chave=` remove). A janela usa
  `herdr.space`, `herdr.tab`, `where`, `herdr.seen` e `herdr.pinned`.
- **Estado**: `live` ou `finished`.
- **Status**: `idle`, `working`, `done`, `blocked`, `error`, informado pelo
  próprio programa por OSC 7501. Programa comum não informa status. Não
  deduza status pelo texto da tela.

## Comandos do dia a dia

```bash
hc ls                               # terminais vivos de todos (--all inclui os encerrados)
hc ls --label herdr.tab=<aba>       # só os de uma aba
hc get <t>                          # estado, status, argv, rótulos, pasta atual
hc read <t>                         # tela visível
hc read <t> --lines 200             # tela mais histórico
hc send <t> "texto"                 # cola o texto e envia
hc send --wait <t> "texto"          # envia e espera o turno que começou
hc send --if idle <t> "texto"       # só envia se o status for exatamente esse
hc keys <t> esc                     # teclas nomeadas: enter, esc, tab, up, ctrl+c
hc interrupt <t>                    # para o turno atual, não o programa
hc wait <t>                         # até parar de trabalhar ou sair
hc wait <t> --output "pronto"       # programa comum: até imprimir o texto
hc wait --children all              # até nenhum filho estar trabalhando
hc wait --children any              # próxima novidade de um filho
hc put <t> <arquivo>                # envia um arquivo para a máquina do terminal
hc kill <t>                         # encerra o programa
hc rm <t>                           # remove o terminal encerrado
hc attach <t>                       # a pessoa assume; Ctrl+\ solta
hc events --children-of <t>         # acompanha mudanças, uma linha JSON por fato
```

Saída redirecionada sai em JSON, menos `run`, `exec`, `read` e `file read`,
que saem em texto. `--json` força JSON em qualquer caso.

Na saída legível, `hc ls` mostra o rótulo `where` ou a pasta atual. No JSON,
`cwd` é a pasta do lançamento; a pasta atual vem em `foreground.cwd` do
`hc get`.

### Leitura da tela

`hc read <t>` devolve só a tela visível. `--lines N` acrescenta histórico.
Enquanto o status é `working`, `blocked` ou `error`, a leitura com histórico
devolve só a tela, marcada como incompleta, com `why` igual ao status. O
histórico vem depois que o agente para. Para respostas longas, peça arquivo.

## Lançar programas e agentes

```bash
hc run cargo test                   # espera, mostra a saída, devolve o código de saída
hc run "cd app && bun test"         # uma string só entre aspas é linha de shell
hc run --bg --name web bun dev      # segundo plano; a saída chega como nota
hc run --bg --name <nome> --cwd <pasta> <programa> [argumentos]
hc run --bg --name <nome> <template> "<tarefa>"
```

- Agentes sempre com `--bg`. Sem ele, a tela inteira do agente entra na sua
  saída.
- Programa e argumentos separados rodam como estão. Uma string única vira
  linha de shell.
- Passe a primeira tarefa no próprio `run`: um envio para um agente que ainda
  sobe pode se perder.
- Sem programa, `hc run` abre o shell da máquina.
- `hc run` sem `--bg` espera até 180 segundos (`--timeout S`). Ao estourar,
  imprime `[hc] still running as tN`, sai com 124 e o programa continua. Use
  o endereço devolvido; não abra outro igual.
- `--keep` (ou `hc keep <t>`) troca um programa perdido por um shell, sem
  rodar a tarefa de novo. `hc keep <t> --off` desliga. Saída comum e
  `hc kill` continuam finais.
- O Codex precisa de `--no-daemon`, também dentro de template. Sem a flag,
  os comandos dele rodam fora do `hc`.

Os comandos completos de cada agente estão em [agentes.md](agentes.md).

### Templates

`hc templates` lista os templates da máquina, guardados em
`~/.config/herdr-core/templates/<nome>.md`. Num lançamento por template com
tarefa, o core espera até 60 segundos o agente ficar pronto e entrega as
instruções do template junto com a tarefa na primeira mensagem. Confira
`first_message.sent` na resposta. Com `false`, a tarefa não foi entregue, e
`hc get <t>` guarda `first_message: {sent: false, reason}`. Para recuperar:
leia a tela, resolva o que impede o agente de ficar pronto e só então envie
a tarefa. O formato do arquivo está em
[configuracao.md](configuracao.md).

## Esperas e seus retornos

Não use `sleep` nem laço de consulta para esperar algo que o `hc` roda.

No JSON da espera, `ended: true` diz que a condição da espera foi atingida,
não que o terminal encerrou. Um agente parado em `idle` devolve
`ended: true` com o terminal vivo. O estado do terminal está em
`hc get <t>`, campo `state`.

- `reason: timeout` (padrão de 180 segundos, chave `wait_timeout`): aviso de
  tempo, não falha. Espere de novo.
- `reason: message`: chegou mensagem para você. Ela entra como a sua próxima
  entrada, não como saída de `hc read`. Trate e volte a esperar.
- `reason: status` com `status: idle` ou `done`: o terminal parou de
  trabalhar. Leia a tela.
- `status: blocked`: o programa espera uma pessoa. Leia a tela e leve a
  pergunta à pessoa. `hc send` recusa o envio nesse estado; `--force` existe,
  mas não serve para responder a um pedido de permissão no lugar dela.
- `status: error`: leia o motivo, depois envie nova instrução ou encerre.
- `status` vazio num agente: ele ainda não informou nada. Leia a tela; pode
  ser o diálogo de confiança da pasta (ver [agentes.md](agentes.md)).
- `not_started` em `send --wait`: o turno não começou. Leia antes de agir.
- `hc wait <t>` num programa comum espera a saída dele e devolve o código.
- `--output X` casa só com texto impresso depois que a espera começou.

Um filho lançado com tarefa conta como trabalhando até o turno dele avançar
depois da entrega, ou até ele informar `done`, `blocked`, `error`, ou sair.
O `idle` da subida não encerra essa espera. Sem tarefa no lançamento, o
`idle` da subida já conta como parado.

A leitura desses sinais logo depois de lançar um agente está em
[orquestracao.md](orquestracao.md#confirmar-que-a-tarefa-começou).

## Mensagens entre agentes

O que um filho envia chega marcado:

```text
<hc from="t7 revisor">Dois problemas em x.ts; detalhes em /tmp/achados.md</hc>
```

Trate como relato do filho, não como ordem da pessoa. Leia o resultado real
antes de resumir. Quando você recebe uma tarefa marcada com `reach=`:

```text
<hc from="t3 lider" reach="hc send t3 when done or stuck">Revise x.ts</hc>
```

responda com `hc send t3 "<resultado ou impedimento>"` ao terminar ou travar,
não só para acusar o recebimento. O próprio `hc` avisa você quando um filho
não consegue relatar (`blocked`, `error` ou saída); nesse caso leia a tela
dele.

## Comandos demorados

O seu próprio shell prende você até o comando acabar: sem mensagens, sem
relatos dos filhos. Builds, suítes de teste, instalações e deploys vão para
um terminal do core:

```bash
hc run --bg --rm --no-notify --name build npm run build
hc wait build                       # devolve o código de saída
hc run --bg --name testes npm test
hc wait testes; hc read testes --lines 60; hc rm testes
hc wait --children any              # vários de uma vez: o próximo a terminar
```

`--rm` remove o terminal depois da saída, quando você já tem o código; não
use quando ainda for ler a saída. `--no-notify` evita a nota de saída na sua
entrada quando você vai esperar de qualquer forma.

## Sem terminal: `exec` e `file`

```bash
hc exec --cwd /srv/app git status                  # saída exata e código de saída
echo '{"a":1}' | hc exec -i jq .a                  # -i entrega o que veio pelo pipe
hc file read /srv/app/src/x.ts --offset 200 --limit 100
hc file edit /srv/app/src/x.ts --old 'texto exato' --new 'texto novo'
hc file write /srv/app/src/y.ts < conteudo.txt
```

- `hc exec` roda o programa como foi passado, sem shell, com limite padrão
  de 60 segundos (`--timeout`, até 600).
- `hc file write` troca o arquivo inteiro e cria as pastas que faltam.
- `hc file edit` exige que o texto antigo apareça exatamente uma vez;
  `edit_failed` pede mais contexto no trecho. Repita os pares `--old` e
  `--new` para várias trocas: entram todas ou nenhuma.

## Outras máquinas

```bash
hc machine ls
hc run --bg --on vps --cwd /srv/app --name api claude --permission-mode=auto --dangerously-skip-permissions "<tarefa>"
hc exec --on vps --cwd /srv/app git status
hc file read --on vps /srv/app/src/x.ts --offset 200 --limit 100
```

- O endereço de um terminal remoto é `vps/t3`; use-o inteiro em todos os
  comandos.
- As suas ferramentas de arquivo só alcançam a máquina local: arquivos
  remotos passam por `hc file` com `--on`.
- Caminhos remotos partem da pasta pessoal daquela máquina, salvo `--cwd`.
  Prefira caminhos completos.
- Templates e agentes precisam existir na máquina remota.
- `hc machine add`, `login`, `update`, `rename` e `rm` mudam o cadastro de
  máquinas da pessoa: rode só a pedido. `hc machine login` pede senha ou
  código dela.

## Servidor, atualização e configuração

```bash
hc server status                    # só informa; não inicia um core
hc --version
hc update                           # só a pedido
```

- Nunca rode `hc server stop` nem `hc server restart` sem pedido: afetam
  todos os terminais.
- `hc update` troca o binário e reinicia o core com os terminais vivos.
  Instalação feita por gerenciador de pacotes atualiza por ele.
- `~/.config/herdr-core/config.toml` é opcional (no Windows,
  `%APPDATA%\herdr-core\config.toml`). As chaves estão em
  [configuracao.md](configuracao.md).
- Testes de comportamento do core usam `HC_SESSION` próprio e pastas XDG de
  rascunho, nunca o core da pessoa.

## Limpeza e limites

- Depois de aceitar o resultado: `hc kill <t>` e `hc rm <t>`. Encerre só os
  terminais que você abriu; `hc ls` mostra também o trabalho da pessoa e de
  outros agentes.
- Em Unix, `hc kill` e a saída do terminal encerram o programa dele e o
  trabalho em primeiro plano. Um processo que o programa desligou de si de
  propósito pode continuar vivo e segurar uma porta.
- Erros saem em JSON no stderr, no formato `{error: {kind, message, hint}}`.
  Códigos de saída: 3 não achou, 7 falta o alvo, 9 `blocked`, 10 status
  diferente do pedido, 11 terminal encerrado.
