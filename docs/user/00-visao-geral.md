# Visão geral

O Herdr mantém terminais e agentes de código vivos e organizados. O Herdrfy
é a skill que ensina o seu agente a trabalhar dentro dele: saber onde está,
abrir outros agentes ao lado, passar tarefas, ler o que eles fizeram e
arrumar a casa no final.

## O que você pode pedir

- "Abra um Codex ao lado e peça uma revisão do diff."
- "Abra três agentes, um para cada pacote, e me traga o resumo."
- "Leia o que o agente da aba de testes respondeu."
- "Configure o Herdr neste projeto."
- "Grave as instruções do Herdr no AGENTS.md."

## Como a skill trabalha

1. **Superfície.** Você diz se está no Herdr TUI ou no Herdr Desktop.
2. **Localização.** O agente roda o localizador e descobre o terminal, a aba
   e o espaço (ou o painel, a aba e o workspace) onde está.
3. **Lugar.** O que ele abrir aparece na mesma aba de onde você pediu. Aba
   ou espaço novo, só se você pedir.
4. **Agentes.** Cada agente é iniciado com as permissões liberadas e recebe
   uma tarefa com escopo escrito.
5. **Acompanhamento.** O agente espera pelos comandos do Herdr, lê a tela do
   outro agente e confere o resultado antes de resumir para você.
6. **Limpeza.** Ele encerra o que abriu e deixa o seu trabalho intacto.

## O que a skill não faz

- Não para o servidor do Herdr nem o herdr-core.
- Não fecha painéis, abas ou espaços que não abriu.
- Não responde no seu lugar a uma pergunta ou pedido de aprovação de outro
  agente. Ela traz a pergunta para você.
- Não usa alias de shell para iniciar agentes.
