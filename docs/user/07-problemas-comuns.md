# Problemas comuns

O que fazer quando o trabalho com os agentes não sai como esperado. Em quase
todos os casos, o primeiro passo é pedir ao seu agente que leia a tela do
outro.

## O agente abriu e não começou a tarefa

Um agente recém-aberto leva alguns segundos para mostrar a tarefa. O Herdrfy
espera, relê a tela e só reenvia depois de duas esperas seguidas sem a
tarefa na tela. Se você vir a mesma tarefa rodar duas vezes, o reenvio foi
cedo demais: avise, para o agente interromper a segunda.

## O agente parou numa pergunta de confiança da pasta

Na primeira vez numa pasta, Claude Code e Codex perguntam se você confia
nela. Quando a pasta é a do seu pedido, o Herdrfy aceita e segue. Para outra
pasta, ele mostra a pergunta e espera a sua resposta. O OpenCode não mostra
esse diálogo.

## O agente está em `blocked`

Ele espera uma pessoa: uma pergunta ou um pedido de aprovação. O Herdrfy lê a
tela e traz a pergunta para você. Ele não responde no seu lugar.

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
  não pertence a uma aba da janela. O que ele abre fica como auxiliar. Peça
  uma aba nova para ver.
- Você moveu o painel ou a aba depois que o agente se localizou: diga a ele,
  para rodar o localizador de novo.
- O agente abriu um auxiliar de propósito, para um trabalho que você não
  pediu para ver. Ele aparece na lista de agentes, sob o agente que o abriu.

## O agente usou o comando da outra superfície

Diga qual é a sua: "estou no TUI" ou "estou no Desktop". Um terminal pode
carregar sinais das duas ao mesmo tempo, e a sua frase vale mais que a
detecção.

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
