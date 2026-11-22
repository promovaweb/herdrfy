# Instruções para agentes

Este repositório guarda a skill `herdrfy`: o método para um agente de código
se localizar, abrir painéis, iniciar e acompanhar outros agentes e configurar
o Herdr, no Herdr TUI (`herdr`) e no Herdr Desktop com herdr-core (`hc`,
`herdr-app`). A instalação é feita com
`npx skills add promovaweb/herdrfy --skill herdrfy -g`.

## Idioma

Scripts sempre em inglês: nomes de arquivo, opções, chaves do JSON,
identificadores, comentários e mensagens de `skills/herdrfy/scripts/`,
`scripts/` e `tests/`.

Todo o resto em português do Brasil: skill, referências, assets, guia,
README e changelog. Termos técnicos, comandos, flags e estados do Herdr
ficam em inglês, como os binários os escrevem (`blocked`, `idle`,
`workspace`). Ao citar a saída de um script no texto, copie a mensagem em
inglês como ele escreve.

## Ordem de leitura

1. Este arquivo.
2. `skills/herdrfy/SKILL.md` e a referência ligada à tarefa.
3. `docs/user/README.md` quando a mudança afetar o guia.
4. `CONTRIBUTING.md` antes de validar ou publicar.

## Regras

- A skill tem `SKILL.md` com frontmatter `name` (igual à pasta) e
  `description`, e as seções: leitura prévia, regras, passos, marcos e
  saída. Detalhes ficam em `references/`, um assunto por arquivo.
- Todo comando, flag, estado e formato de resposta citado precisa ter sido
  visto na versão atual: `hc --skill`, `hc <comando> --help`,
  `herdr <grupo>`, `herdr --default-config`, `herdr-app --skill` ou um teste
  real. Não escreva sintaxe de memória.
- Os comandos completos dos agentes (`claude --permission-mode=auto
  --dangerously-skip-permissions`, `codex --yolo --no-daemon`,
  `opencode --auto`) aparecem iguais em `references/agentes.md`,
  `references/configuracao.md`, `assets/instrucoes-bloco.md` e
  `assets/templates/`. Ao mudar um, mude todos; o validador confere.
- A skill nunca instrui o uso de alias de shell para iniciar agentes.
- Texto de instrução em prosa direta, verbos no imperativo, sem travessão
  como pontuação, sem clichês de abertura ou fechamento e sem as famílias de
  palavras que o validador veta. Nomeie a consequência, a escolha, a
  comprovação ou a regra em vez do termo genérico.
- Scripts em Node.js, sem dependências, com cabeçalho que explica uso,
  saída e códigos de saída. Todos aceitam `--help` e saem com 2 para
  argumento desconhecido. Eles só leem o Herdr; quem altera terminais é o
  agente, pelos comandos do Herdr.
- Mudança no nome de um script, de uma opção, de uma chave do JSON ou de um
  marcador atinge `SKILL.md`, as referências, o guia, o README e os testes.
  Troque todos na mesma mudança e registre no changelog a ação que ela pede
  de quem já instalou.
- A leitura dos sinais logo depois de lançar um agente fica só em
  `references/orquestracao.md`, seção "Confirmar que a tarefa começou". Os
  outros arquivos apontam para ela.
- Testes de comportamento novo do Herdr usam terminais e sessões próprios
  (`herdr --session <nome> server` para o TUI) e são encerrados ao final.
  Não pare o servidor nem o core de ninguém.

## Validação antes de concluir

```bash
npm run validate
```

Confira `git status --short` ao final e preserve mudanças que já existiam.

## Publicação

Versão em `package.json`, entrada em `CHANGELOG.md`, tag `vX.Y.Z` e GitHub
Release, criada pelo workflow `Release` quando a tag chega. O fluxo está em
`CONTRIBUTING.md`.

## Status das tarefas no ClickUp

Após cada commit bem-sucedido, marque como `pronto` a tarefa ou subtarefa vinculada à entrega. Após o push bem-sucedido desse commit, marque-a como `publicado`. Registre repositório, SHA e destino do push na tarefa e confirme o status pelo ClickUpfy.

| Status | Quando usar |
| --- | --- |
| `nao iniciado` | Demanda registrada que ainda não foi priorizada. |
| `triagem` | Esclareça o pedido, confira duplicidades e identifique o responsável. |
| `proxima etapa` | Trabalho priorizado que já tem próxima ação e condição de aceite. |
| `em andamento` | Há alguém executando a tarefa, com plano e cronômetro. |
| `refazer` | A revisão pediu ajustes. Registre o que corrigir e retome em `em andamento` ao começar. |
| `revisar` | A entrega está disponível e validada para revisão. Registre como conferi-la. |
| `pronto` | O commit da entrega foi criado. Registre o repositório e o SHA. |
| `publicado` | O push do commit foi confirmado. Registre remoto, branch e versão ou release quando aplicável. |
| `concluido` | Encerramento por orientação do usuário após conferir a entrega em produção ou o aceite da entrega interna. |
