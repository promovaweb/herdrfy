# Contribuindo com o Herdrfy

Este guia é para quem mexe no código, revisa ou mantém o Herdrfy. Para instalar e usar a skill, comece pelo [`README.md`](README.md). O método completo que a skill ensina está em [`skills/herdrfy/SKILL.md`](skills/herdrfy/SKILL.md). As regras para agentes de código neste repositório estão em [`AGENTS.md`](AGENTS.md).

A skill roda sobre o [Herdr](https://github.com/herdrdev/herdr), o [herdr-core](https://github.com/herdrdev/herdr-core) e o [Herdr Desktop](https://github.com/herdrdev/herdr-app), com scripts em [Node.js](https://github.com/nodejs/node) sem dependências.

## Antes de começar

- Converse no [Discord](https://promovaweb.com/discord) antes de um pull request grande ou de uma mudança de escopo.
- Abra uma [issue](https://github.com/promovaweb/herdrfy/issues) por mudança, com a versão da skill, a superfície usada e o passo a passo para reproduzir.
- Correção de texto, link quebrado e exemplo errado dispensam issue, desde que o pull request descreva o problema.

## Ambiente

Requisitos: Node.js 18 ou mais novo e Git. O repositório não tem dependências para instalar.

```bash
git clone https://github.com/promovaweb/herdrfy.git
cd herdrfy
node --version
```

Os scripts funcionam sem um Herdr instalado: fora dele, o localizador responde `Outside Herdr` e o diagnóstico lista as pendências. Os testes usam `hc` e `herdr` falsos no `PATH`, então não precisam dos binários reais.

Para rodar os scripts deste checkout:

```bash
npm run where
npm run doctor
node skills/herdrfy/scripts/instructions.mjs --help
```

## Organização do código

| Caminho | Conteúdo |
| --- | --- |
| `skills/herdrfy/SKILL.md` | regras, passos, marcos e saída da skill |
| `skills/herdrfy/references/` | um assunto por arquivo: superfícies, agentes, herdr-core, Desktop, TUI, orquestração, configuração e instruções |
| `skills/herdrfy/scripts/` | `where.mjs`, `doctor.mjs` e `instructions.mjs` |
| `skills/herdrfy/assets/` | texto do bloco de instruções e templates do herdr-core |
| `scripts/validate.mjs` | validador do repositório |
| `tests/scripts.test.mjs` | testes dos scripts, com `hc` e `herdr` falsos no `PATH` |
| `docs/user/` | guia de uso para quem usa a skill |
| `brand/` | kit de marca: logo, favicons, paleta, tokens, fontes e guia visual. Leia `brand/README.md` antes de usar o logo |
| `.github/workflows/` | `CI`, que valida pull requests. `Release`, que publica a tag |

## Fluxo de trabalho

1. Abra ou encontre a issue da mudança.
2. Crie uma branch curta a partir de `main`.
3. Altere o texto da skill, a referência ou o script. Uma mudança de comportamento entra na referência certa, não numa seção genérica.
4. Rode `npm run validate`.
5. Abra o pull request com a issue relacionada e a validação executada.

Para um comando ou uma flag nova do Herdr, confira a sintaxe na versão instalada antes de escrever: `hc --skill`, `hc <comando> --help`, `herdr <grupo>`, `herdr --default-config`, `herdr-app --skill` ou um teste real. Não escreva sintaxe de memória.

Comportamento novo do Herdr é conferido num teste real, em terminal e sessão próprios, encerrados ao final:

```bash
herdr --session <nome> server
```

Não pare o servidor do Herdr nem o core de outra pessoa.

## Regras do código

- **Idioma:** scripts em inglês, do nome do arquivo à mensagem de saída, incluindo opções, chaves do JSON, comentários e códigos de saída. Skill, referências, assets, guia, README, changelog e mensagens de commit em português do Brasil. Termos técnicos, comandos, flags e estados do Herdr ficam em inglês, como os binários os escrevem (`blocked`, `idle`, `workspace`).
- **Comandos dos agentes:** `claude --permission-mode=auto --dangerously-skip-permissions`, `codex --yolo --no-daemon` e `opencode --auto` aparecem iguais em `references/agentes.md`, `references/configuracao.md`, `assets/instrucoes-bloco.md` e `assets/templates/`. Ao mudar um, mude todos, porque o validador confere.
- **Sem alias de shell:** a skill nunca instrui iniciar agente por `cc`, `cx`, `oc` ou `zsh -ic`.
- **Scripts:** Node.js sem dependências, cabeçalho que explica uso, saída e códigos de saída. Todos aceitam `--help` e saem com 2 para argumento desconhecido. Eles só leem o Herdr. Quem altera terminais é o agente, pelos comandos do Herdr.
- **Texto da skill:** prosa direta, verbos no imperativo, sem travessão como pontuação, sem clichê de abertura ou fechamento e sem as famílias de palavras que o validador veta.
- **Nomes aposentados:** nomes de script, opção e marcador anteriores à 0.2.0 não voltam ao texto. O validador reprova a mudança.
- **Mudança de nome:** script, opção, chave do JSON ou marcador afeta `SKILL.md`, as referências, o guia, o README e os testes. Troque todos na mesma mudança e registre no changelog a ação que ela pede de quem já instalou.
- **Instruções do agente:** a leitura dos sinais logo depois de lançar um agente fica só em `references/orquestracao.md`, seção "Confirmar que a tarefa começou". Os outros arquivos apontam para ela.

## Validar

```bash
npm run validate
```

O comando roda `scripts/validate.mjs` e os testes. Ele confere:

- a estrutura da skill: `SKILL.md` com `name` igual à pasta, `description` de até 1024 caracteres e ao menos um arquivo em `references/`;
- todo link relativo do Markdown, em qualquer arquivo do repositório;
- o texto da skill sem travessão e sem as famílias de palavras vetadas;
- os comandos completos dos agentes, iguais nos quatro lugares e nos templates;
- a versão de `package.json` igual à primeira entrada do `CHANGELOG.md`;
- a sintaxe dos scripts com `node --check`;
- nomes aposentados fora do `CHANGELOG.md`;
- os testes dos scripts.

Comandos auxiliares:

```bash
npm run skills:validate   # só a estrutura, os links, o texto e os comandos
npm test                  # só os testes dos scripts
```

## Documentação

| Onde | O que atualizar |
| --- | --- |
| `README.md` | instalação, primeiros passos, uso e links públicos |
| `docs/user/` | guia de quem usa a skill, um capítulo por assunto |
| `skills/herdrfy/references/` | sintaxe e comportamento por tarefa |
| `AGENTS.md` | regras para agentes que trabalham neste repositório |
| `CHANGELOG.md` | toda versão publicada |
| `brand/` | ativos e tokens de marca; o logo não é redesenhado nem reexportado à mão |

O guia de uso em `docs/user/` é publicado em <https://promovaweb.com/docs/herdrfy/> pelo Hub da Promovaweb; a página da skill na Central de Skills fica em <https://promovaweb.com/skills/herdrfy/>. O portal do Herdr fica em <https://promovaweb.com/herdr/>. Mudança de comando, de opção ou de fluxo entra no guia na mesma mudança do código.

Quando o texto do bloco de instruções ou o nome de um script muda, rode `node skills/herdrfy/scripts/instructions.mjs --check` nos projetos de teste e escreva no changelog que quem já instalou precisa rodar o script de novo.

## Commits e pull requests

- Mensagem de commit em português, no imperativo e com prefixo: `feat:`, `fix:`, `docs:` ou `build:`.
- O pull request traz o que mudou, por quê, a issue relacionada e a saída de `npm run validate`.
- Mudança de texto da skill ou de referência inclui o link da fonte conferida.
- Mudança de script inclui o teste que cobre o comportamento novo.

## Releases

O projeto segue versionamento semântico:

- **patch:** correção de texto, de script ou de exemplo;
- **minor:** referência, script ou capacidade nova da skill;
- **major:** mudança que exige ação de quem já usa, como troca de nome de script ou de marcador do bloco de instruções. Enquanto a versão começar por `0.`, essa mudança sobe o segundo número e o changelog diz qual ação ela pede.

Passo a passo:

1. Atualize `version` em `package.json`.
2. Acrescente a entrada no topo de `CHANGELOG.md`, no formato `## [X.Y.Z]` seguido do link da release e da data `(AAAA-MM-DD)`, com as seções que couberem: Funcionalidades, Correções, Documentação, Build.
3. Rode `npm run validate`.
4. Faça o commit da versão.
5. Crie a tag `vX.Y.Z` e envie commit e tag para `origin/main`.
6. O workflow `Release` valida, confere se a tag bate com `package.json`, extrai as notas do changelog e publica a GitHub Release.
7. Confira a release com `gh release view vX.Y.Z`.

Uma tag publicada não é movida nem reaproveitada. Correção posterior recebe versão nova.

## Quem já instalou

Quem instalou com `npx skills add` atualiza rodando o mesmo comando. Quando o texto do bloco de instruções ou o nome de um script muda, avise no changelog: os projetos precisam rodar `instructions.mjs` de novo para receber o bloco novo.

## Licença

As contribuições entram sob a mesma licença do projeto, a [GNU AGPL 3.0](LICENSE). Ao abrir um pull request, você concorda em publicar a sua contribuição sob a AGPL 3.0. Versões já publicadas continuam sob a licença com que saíram.
