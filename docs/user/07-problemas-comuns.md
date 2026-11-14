# Problemas comuns

O que fazer quando o trabalho com os agentes não sai como esperado. Na maior
parte dos problemas abaixo, o primeiro passo é mandar o seu agente ler a tela
do outro.

## O agente abriu e não começou a tarefa

Um agente recém-aberto leva alguns segundos para mostrar a tarefa. O Herdrfy
espera, relê a tela e só reenvia depois de duas esperas seguidas sem a
tarefa na tela. Quando a mesma tarefa roda em dobro, o reenvio foi cedo
demais: avise, para o agente interromper a segunda execução.

## O agente parou numa pergunta de confiança da pasta

Na primeira vez numa pasta, Claude Code e Codex perguntam se você confia
nela. Quando a pasta é a da sua tarefa, o Herdrfy aceita e segue. Para outra
pasta, ele mostra a pergunta e espera a sua resposta. O OpenCode não mostra
esse diálogo.

## O agente está em `blocked`

Ele espera a sua resposta a uma pergunta ou a uma confirmação de permissão. O
Herdrfy lê a tela e traz a pergunta para você, sem responder no seu lugar.

## A tela do agente aparece cortada

Num painel estreito, o texto do agente quebra em linhas curtas. No Desktop
sem o `herdr-app` na máquina, a janela escolhe a posição e o tamanho do
painel. Peça o resultado em arquivo, ou alargue o painel na janela.

## O painel não apareceu na minha aba

Confira com o localizador:

```bash
node ~/.agents/skills/herdrfy/scripts/where.mjs
```

- Linha `Placement` no lugar de `Space` e `Tab`: o terminal do seu agente
  não pertence a uma aba da janela, então o que ele abre fica como auxiliar.
  Para ver o auxiliar, mande abrir uma aba nova.
- Você moveu o painel ou a aba depois que o agente se localizou: diga a ele,
  para rodar o localizador de novo.
- O agente abriu um auxiliar de propósito, para um trabalho que não precisava
  de painel. Ele aparece na lista de agentes, sob o agente que o abriu.

## O agente usou o comando da outra superfície

Diga qual é a sua: "estou no TUI" ou "estou no Desktop". Como um terminal pode
carregar sinais das duas ao mesmo tempo, a sua frase vale mais que a detecção.

## Pedi uma aba no Desktop e ela abriu no TUI

Aconteceu porque o terminal do agente carregava `HERDR_ENV=1` e um
`HERDR_PANE_ID` de um Herdr TUI que rodava antes na máquina. Com o servidor
do TUI no ar, o comando `herdr` do agente funcionou e criou a aba no TUI, não
na janela do Desktop. O mesmo vale ao contrário: um painel do TUI aberto
dentro de um terminal do core herda `HC_TERMINAL_ID`.

O agente agora decide a superfície pela árvore de processos: processo
`herdr-core` é Desktop, processo `herdr` é TUI. Num terminal do core, ele usa
`hc`, mesmo com `HERDR_ENV=1`. O localizador mostra o resultado em
`detection` e abre a saída em texto com uma linha `Warning:` quando as
variáveis da outra superfície estão herdadas. Quando a superfície que você
informa contraria a árvore, a resposta traz `mismatch: true` e o aviso de que
os comandos dela não chegam onde o agente roda.

## O bloco de instruções ficou velho

Depois de atualizar a skill, rode na pasta do projeto:

```bash
node ~/.agents/skills/herdrfy/scripts/instructions.mjs --check
node ~/.agents/skills/herdrfy/scripts/instructions.mjs
```

`outdated` indica um bloco de versão anterior. Se o comando do localizador
dentro do bloco apontar para um arquivo que não existe mais, é esse o caso.

## O `AGENTS.md` manda abrir agentes por alias

O script de instruções avisa com `warning: alias rule outside the block` e os
números das linhas. O Herdrfy usa o comando completo e pergunta se você quer
trocar o trecho antigo.

## Sobrou um terminal aberto

O Herdrfy encerra só o que ele abriu, depois de você aceitar o resultado.
Para conferir o que está vivo: `hc ls` no Desktop, `herdr pane list` no TUI.
Ele não para o servidor do Herdr nem o herdr-core para limpar.

## Um script respondeu `Unknown argument`

Os scripts aceitam só as opções listadas em `--help` e saem com código 2
para qualquer outra. As opções mudaram de nome na versão 0.2.0: `--surface`,
`--project`, `--file` e `--remove`.
