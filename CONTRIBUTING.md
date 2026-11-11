# Contribuir e publicar

Guia para quem mantém este repositório. Quem usa a skill encontra o guia de
uso em [`docs/user/`](docs/user/README.md). As regras para agentes de código
estão em [`AGENTS.md`](AGENTS.md).

## Idioma

- **Scripts em inglês**: nomes de arquivo, opções, chaves do JSON,
  identificadores, comentários e mensagens de `skills/herdrfy/scripts/`,
  `scripts/` e `tests/`.
- **Todo o resto em português do Brasil**: skill, referências, assets, guia,
  README, changelog e mensagens de commit.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `skills/herdrfy/SKILL.md` | regras, passos, marcos e saída |
| `skills/herdrfy/references/` | um assunto por arquivo |
| `skills/herdrfy/scripts/` | `where.mjs`, `doctor.mjs`, `instructions.mjs` |
| `skills/herdrfy/assets/` | texto do bloco de instruções e templates do herdr-core |
| `scripts/validate.mjs` | validador do repositório |
| `tests/` | testes dos scripts, com `hc` e `herdr` falsos no `PATH` |
| `docs/user/` | guia de uso |

## Validar

```bash
npm run validate
git status --short
```

A validação confere a estrutura da skill, os links, o texto de instrução, os
comandos dos agentes, a versão no changelog, a sintaxe dos scripts e a
ausência de nomes aposentados (scripts, opções e marcadores anteriores à
0.2.0), e roda os testes. Não há dependências a instalar.

Um comportamento novo do Herdr é conferido num teste real antes de entrar no
texto, em sessão própria (`herdr --session <nome> server` no TUI,
`HC_SESSION` próprio no herdr-core), encerrada ao final.

## Versão

O projeto segue versionamento semântico:

- **patch**: correção de texto, de script ou de exemplo;
- **minor**: referência, script ou capacidade nova da skill;
- **major**: mudança que exige ação de quem já usa, como troca de nome de
  script ou de marcador do bloco de instruções. Enquanto a versão começar
  por `0.`, essa mudança sobe o segundo número e o changelog diz qual ação
  ela pede.

## Publicar

1. Atualize `version` em `package.json`.
2. Acrescente a entrada no topo de `CHANGELOG.md`, no formato
   `## [X.Y.Z]` seguido do link da release e da data `(AAAA-MM-DD)`, com as
   seções que couberem: Funcionalidades, Correções, Documentação, Build.
3. Rode `npm run validate`.
4. Faça o commit da versão.
5. Crie a tag `vX.Y.Z` e envie commit e tag para `origin/main`.
6. O workflow `Release` valida, confere se a tag bate com `package.json`,
   extrai as notas do changelog e publica a GitHub Release.
7. Confira a release: `gh release view vX.Y.Z`.

Uma tag publicada não é movida nem reaproveitada. Correção posterior recebe
versão nova.

## Quem já instalou

Quem instalou com `npx skills add` atualiza rodando o mesmo comando. Quando
o texto do bloco de instruções ou o nome de um script muda, avise no
changelog: os projetos precisam rodar `instructions.mjs` de novo para
receber o bloco novo.
