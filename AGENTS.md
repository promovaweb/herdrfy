# Instruções para agentes

Este repositório guarda a skill `herdrfy`: o método para um agente de código
se localizar, abrir painéis, iniciar e acompanhar outros agentes e configurar
o Herdr, no Herdr TUI (`herdr`) e no Herdr Desktop com herdr-core (`hc`,
`herdr-app`). A instalação é feita com
`npx skills add promovaweb/herdrfy --skill herdrfy -g`.

## Idioma

Português do Brasil em skill, referências, guia, changelog, comentários e
mensagens dos scripts. Termos técnicos, comandos, flags e estados do Herdr
ficam em inglês, como os binários os escrevem (`blocked`, `idle`,
`workspace`).

## Ordem de leitura

1. Este arquivo.
2. `skills/herdrfy/SKILL.md` e a referência ligada à tarefa.
3. `docs/user/README.md` quando a mudança afetar o guia.

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
  saída e códigos de saída. Eles só leem o Herdr; quem altera terminais é o
  agente, pelos comandos do Herdr.
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
`docs/user/07-publicacao.md`.
