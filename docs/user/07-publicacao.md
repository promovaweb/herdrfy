# Publicação

Fluxo de versão deste repositório.

## Antes

```bash
npm run validate
git status --short
```

A validação confere a estrutura da skill, os links, o texto de instrução, os
comandos dos agentes, a versão no changelog e roda os testes dos scripts.

## Versão

O projeto segue versionamento semântico:

- **patch**: correção de texto, de script ou de exemplo;
- **minor**: referência, script ou capacidade nova da skill;
- **major**: mudança que exige ação de quem já usa, como troca de nome de
  script ou de marcador do bloco de instruções.

## Passos

1. Atualize `version` em `package.json`.
2. Acrescente a entrada no topo de `CHANGELOG.md`, no formato
   `## [X.Y.Z]` seguido do link da release e da data `(AAAA-MM-DD)`, com as seções que couberem:
   Funcionalidades, Correções, Documentação, Build.
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
o texto do bloco de instruções muda, avise no changelog: os projetos
precisam rodar `node scripts/instrucoes.mjs` de novo para receber o bloco
novo.
