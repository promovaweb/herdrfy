---
name: herdrfy
description: Orquestra o Herdr e os agentes de código nas duas superfícies, Herdr TUI (comando herdr) e Herdr Desktop com herdr-core (comandos hc e herdr-app). Use quando a pessoa pedir para configurar o Herdr, localizar o agente nas janelas, abrir painéis, abas, espaços ou workspaces, iniciar agentes Claude Code, Codex ou OpenCode com as permissões liberadas, enviar tarefas, ler a tela de outro agente, esperar resultados, limpar terminais ou gravar as instruções do Herdr no AGENTS.md e no CLAUDE.md.
---

# Herdrfy

Skill orquestradora do Herdr. Ela cobre as duas superfícies com um método só:
saber onde o agente está, abrir o que foi pedido no lugar certo, iniciar os
agentes com as permissões liberadas, acompanhar o trabalho deles pela tela e
limpar o que abriu.

| Superfície | O que a pessoa vê | Comandos |
| --- | --- | --- |
| Herdr TUI | workspaces, abas e painéis dentro de um terminal | `herdr` |
| Herdr Desktop | janela com espaços, abas e painéis; os terminais vivem no herdr-core | `hc` para terminais e agentes, `herdr-app` para a janela |

## Leitura prévia

Leia só o que a tarefa pede:

| Tarefa | Referência |
| --- | --- |
| Saber a superfície e a posição do agente | [references/superficies.md](references/superficies.md) |
| Iniciar agentes com as flags de permissão | [references/agentes.md](references/agentes.md) |
| Trabalhar no Herdr Desktop e no herdr-core | [references/desktop.md](references/desktop.md) |
| Trabalhar no Herdr TUI | [references/tui.md](references/tui.md) |
| Delegar, acompanhar, coletar e limpar | [references/orquestracao.md](references/orquestracao.md) |
| Instalar e configurar Herdr, skills, integrações e templates | [references/configuracao.md](references/configuracao.md) |
| Gravar as instruções no `AGENTS.md` e no `CLAUDE.md` | [references/instrucoes.md](references/instrucoes.md) |

Uma vez por sessão, antes do primeiro comando, leia também o manual embutido
no binário da superfície: `hc --skill` no Desktop (e `herdr-app --skill`
quando ele existir), `herdr --skill` ou `herdr <grupo>` sem subcomando no
TUI. Eles acompanham a versão instalada e valem mais que esta skill quando
houver diferença de sintaxe.

Os scripts ficam em `scripts/`, ao lado deste arquivo, e rodam com Node.js 18
ou mais novo. Nos exemplos, `<skill>` é a pasta desta skill. Numa instalação
feita pelo `npx skills`, `~/.agents/skills/herdrfy` e os links nas pastas
dos agentes, como `~/.claude/skills/herdrfy`, levam aos mesmos arquivos;
qualquer um serve.

## Regras

1. **A pessoa informa a superfície.** Ela diz se está no TUI ou no Desktop.
   Use o que ela disser. Sem essa informação, rode o localizador sem
   `--superficie`; se ele responder "fora do Herdr" ou a resposta contrariar
   o pedido, pergunte uma vez na sessão e guarde a resposta.
2. **Localize antes de agir.** Rode
   `node <skill>/scripts/onde.mjs --superficie <tui|desktop>` antes do primeiro
   comando do Herdr e depois de qualquer mudança de lugar. Use os IDs que ele
   devolve. Não use `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID` e `HERDR_PANE_ID`
   como endereço: elas envelhecem quando o painel é movido e aparecem
   herdadas em terminais do herdr-core.
3. **Um comando por superfície.** No Desktop use `hc` e `herdr-app`, nunca
   `herdr`. No TUI use `herdr`, nunca `hc`. `HC_TERMINAL_ID` presente indica
   terminal do herdr-core mesmo com `HERDR_ENV=1` no ambiente.
4. **Painel novo na aba de quem pediu.** Todo painel novo abre na mesma aba
   do agente que recebeu o pedido. Aba, espaço ou workspace novo só quando a
   pessoa pedir com essas palavras. No Desktop, repita no terminal novo os
   rótulos `herdr.space` e `herdr.tab` do seu terminal. No TUI, divida o seu
   painel.
5. **Agentes sempre com as permissões liberadas.** Inicie Claude Code, Codex,
   OpenCode e qualquer outro agente pelo comando completo com as flags da
   tabela de [references/agentes.md](references/agentes.md). Não use alias de
   shell (`cc`, `cx`, `oc`), não use `zsh -ic` e não inicie agente sem as
   flags. Se o `AGENTS.md` ou o `CLAUDE.md` do ambiente mandar iniciar por
   alias, o pedido de usar esta skill vale para o lançamento: use o comando
   completo, que leva as mesmas flags, e avise a pessoa da diferença entre
   as duas regras no relato final.
6. **Agente interativo, em segundo plano.** Nada de modo de impressão única
   (`claude -p`, `codex exec`, `opencode run`): o agente precisa continuar
   visível, receber novas mensagens e aceitar que a pessoa assuma o terminal.
7. **Leia a tela antes de reenviar, responder ou resumir.** Um envio que
   falhou pode ter chegado. Um status vazio pode ser um diálogo de confiança
   da pasta. Um resultado só vale depois de lido na tela ou no arquivo.
8. **Espere com os comandos do Herdr.** Use `hc wait` e
   `herdr agent wait`/`herdr pane wait-output`. Não use `sleep` nem laço de
   consulta.
9. **Pergunta de permissão é da pessoa.** Quando um agente parar em `blocked`
   com uma pergunta ou pedido de aprovação, leia a tela e leve a pergunta à
   pessoa. A exceção é o diálogo de confiança da pasta que a própria pessoa
   indicou para o trabalho: aceite e siga.
10. **Encerre só o que você abriu.** Não feche painéis, abas, espaços,
    workspaces ou sessões de outra origem. Nunca rode `hc server stop`,
    `hc server restart` ou `herdr server stop` sem pedido explícito.
11. **Foco fica com a pessoa.** No TUI use `--no-focus`. No Desktop não mude
    o que a janela mostra sem pedido.

## Passos

### 1. Localizar

```bash
node <skill>/scripts/onde.mjs --superficie desktop   # ou tui
node <skill>/scripts/onde.mjs --json                 # para ler por script
```

Guarde da resposta: no Desktop, o endereço do terminal (`t1s`), o espaço
(`sp...`), a aba (`tb...`), a pasta e se o `herdr-app` existe na máquina; no
TUI, o workspace (`w1`), a aba (`w1:t1`) e o painel (`w1:p1`). Com
`encontrado: false`, o agente não roda dentro daquela superfície: opere por
IDs explícitos da lista devolvida e avise a pessoa antes de abrir qualquer
coisa. Detalhes em [references/superficies.md](references/superficies.md).

### 2. Conferir a instalação, quando o pedido for configurar

```bash
node <skill>/scripts/diagnostico.mjs
```

A saída lista binários, servidores, integrações, skills, templates, agentes e
as pendências com o comando de cada uma. Siga
[references/configuracao.md](references/configuracao.md) para resolver.
Instalação de binário e mudança em arquivo de configuração da pessoa pedem a
confirmação dela, salvo quando o pedido já for esse.

### 3. Abrir o lugar do trabalho

Painel na aba de quem pediu, com um shell:

```bash
# Desktop: mesmos rótulos do seu terminal
hc run --bg --name <nome> --cwd "$PWD" \
  --label herdr.space=<seu-espaço> --label herdr.tab=<sua-aba>

# TUI: divide o seu painel sem tirar o foco
herdr pane split <seu-painel> --direction right --cwd "$PWD" --no-focus
```

Aba, espaço e workspace novos, só a pedido, estão em
[references/desktop.md](references/desktop.md) e
[references/tui.md](references/tui.md).

### 4. Iniciar o agente com as permissões liberadas

```bash
# Desktop: painel na sua aba, agente e primeira tarefa no mesmo comando
hc run --bg --name revisor --cwd "$PWD" \
  --label herdr.space=<seu-espaço> --label herdr.tab=<sua-aba> \
  claude --permission-mode=auto --dangerously-skip-permissions \
  "Revise só src/x.ts, sem editar e sem abrir outros agentes. Ao terminar ou travar, avise com: hc send $HC_TERMINAL_ID '<resultado>'"

# TUI: painel novo, depois o agente, depois a tarefa
herdr pane split <seu-painel> --direction right --cwd "$PWD" --no-focus
herdr agent start revisor --kind claude --pane <painel-novo> -- \
  --permission-mode=auto --dangerously-skip-permissions
herdr agent prompt revisor "Revise só src/x.ts, sem editar." --wait --timeout 300000
```

Para Codex e OpenCode troque só o comando, conforme a tabela de
[references/agentes.md](references/agentes.md). Dê a cada agente um nome
único, um escopo exato e a forma de avisar o fim.

### 5. Confirmar que a tarefa começou

No Desktop, espere o primeiro sinal e leia a tela:

```bash
hc wait revisor --timeout 30
hc read revisor
```

Leia o retorno assim:

- `idle` com `turn: 0` e tela sem a tarefa logo depois do lançamento: o
  agente ainda está subindo, mesmo que já mostre o campo de entrada vazio.
  A tarefa passada no comando leva alguns segundos para aparecer. Espere de
  novo e releia. Não reenvie nada.
- Status vazio depois da espera: costuma ser o diálogo de confiança da
  pasta. Responda conforme a regra 9 (`hc keys revisor down enter` no Claude
  Code, `hc keys revisor enter` no Codex), espere de novo e leia a tela.
- Tarefa visível na tela, com o agente em `working` ou já com resposta: a
  tarefa começou.

Só reenvie a tarefa depois de pelo menos duas esperas seguidas com o agente
parado, o campo de entrada vazio e a tela sem a tarefa nem a resposta. Em
painel estreito a tarefa aparece cortada; o começo dela na tela já prova que
chegou.

No TUI, `agent start` devolve `agent_not_ready` quando o agente para num
diálogo: leia com `herdr agent read`, responda com `herdr agent send-keys` e
só então envie a tarefa.

### 6. Acompanhar, conversar e coletar

| Ação | Desktop | TUI |
| --- | --- | --- |
| Listar | `hc ls` | `herdr agent list`, `herdr pane list` |
| Ver um | `hc get <t>` | `herdr agent get <alvo>` |
| Ler a tela | `hc read <t> --lines 120` | `herdr agent read <alvo> --source recent-unwrapped --lines 120` |
| Enviar tarefa | `hc send <t> "..."` | `herdr agent prompt <alvo> "..."` |
| Enviar e esperar | `hc send --wait <t> "..."` | `herdr agent prompt <alvo> "..." --wait --timeout <ms>` |
| Esperar | `hc wait <t>`, `hc wait --children all` | `herdr agent wait <alvo> --timeout <ms>` |
| Teclas | `hc keys <t> esc` | `herdr agent send-keys <alvo> esc` |
| Parar o turno | `hc interrupt <t>` | `herdr agent send-keys <alvo> esc` |

Continue o seu trabalho enquanto os agentes trabalham. Peça respostas longas
em arquivo e leia o arquivo. No Desktop, `hc read` de um agente em `working`
devolve só a tela visível, mesmo com `--lines`; o histórico vem depois que
ele para. O aviso que o agente envia com `hc send` chega antes de o turno
dele acabar: a espera volta com `reason: message` e o agente ainda em
`working`. Espere mais uma vez até `idle` ou `done` antes de encerrar. Os padrões de delegação estão em
[references/orquestracao.md](references/orquestracao.md).

### 7. Limpar

Depois de ler e aceitar o resultado, encerre o que você abriu:

```bash
hc kill <t> && hc rm <t>          # Desktop
herdr pane close <painel>          # TUI
```

Deixe aberto o que a pessoa pediu para manter visível.

### 8. Gravar as instruções, quando o pedido for configurar o projeto

```bash
node <skill>/scripts/instrucoes.mjs --check     # confere
node <skill>/scripts/instrucoes.mjs             # AGENTS.md e CLAUDE.md do projeto
node <skill>/scripts/instrucoes.mjs --global    # arquivos globais dos agentes
```

O bloco fica entre marcadores e é trocado a cada execução, sem tocar no resto
do arquivo. Detalhes em [references/instrucoes.md](references/instrucoes.md).

## Marcos

- Superfície informada pela pessoa e posição confirmada pelo localizador.
- Cada painel novo na aba de quem pediu, salvo pedido de aba ou espaço novo.
- Cada agente iniciado pelo comando completo com as flags de permissão,
  conferido em `hc get <t>` (campos `argv` e `foreground.argv`) ou em
  `herdr pane process-info --pane <id>`.
- Tarefa de lançamento vista na tela do agente.
- Resultado lido na tela ou no arquivo antes de qualquer resumo.
- Terminais e painéis auxiliares encerrados; os da pessoa, intactos.

## Saída

Ao terminar, informe em poucas linhas:

- a superfície e a posição usadas (terminal, espaço e aba, ou workspace, aba
  e painel);
- o que foi aberto, com nome, endereço e comando de cada agente;
- o resultado de cada agente, com o caminho do arquivo quando houver;
- o que ficou aberto de propósito e o que foi encerrado;
- o que ficou pendente de resposta da pessoa, como um agente parado em
  `blocked`.
