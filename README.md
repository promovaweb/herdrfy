# Herdrfy

Skill da Promovaweb que ensina um agente de código a orquestrar o
[Herdr](https://herdr.dev) e os outros agentes que rodam nele, nas duas
superfícies: o **Herdr TUI** (comando `herdr`) e o **Herdr Desktop**, que roda
sobre o herdr-core (comandos `hc` e `herdr-app`).

Com ela, o agente:

- descobre onde está: terminal, espaço e aba no Desktop; workspace, aba e
  painel no TUI;
- abre painéis na mesma aba de quem pediu, e abas, espaços ou workspaces
  novos quando você pede;
- inicia Claude Code, Codex, OpenCode e outros agentes com as permissões
  liberadas, pelo comando completo, sem depender de alias;
- envia tarefas, lê a tela dos agentes, espera o fim do trabalho e confere
  o resultado antes de resumir;
- configura o Herdr: binários, skills oficiais, integrações, templates e
  arquivos de configuração;
- grava as regras no `AGENTS.md` e no `CLAUDE.md`, para os próximos agentes
  seguirem o mesmo método.

## Instalar

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g
```

`-g` instala para todos os seus projetos. Sem `-g`, a skill entra só no
projeto atual. Para atualizar, rode o mesmo comando de novo.

Requisitos: Node.js 18 ou mais novo (para os scripts da skill) e ao menos um
dos produtos do Herdr instalado. A skill também orienta a instalação deles.

## Usar

Diga ao agente em qual superfície você está e o que quer:

> Estou no Herdr Desktop. Use herdrfy para abrir um Codex ao lado e pedir uma
> revisão do diff atual.

> Estou no TUI. Use herdrfy para configurar o Herdr neste projeto e gravar as
> instruções no AGENTS.md.

> Use herdrfy para abrir três agentes, um por pasta de `packages/`, e me
> trazer um resumo do que cada um encontrou.

Se você não informar a superfície, o agente tenta detectar e, na dúvida,
pergunta uma vez.

## Agentes sempre com as permissões liberadas

O Herdrfy inicia todo agente com as flags que dispensam os pedidos de
aprovação:

| Agente | Comando |
| --- | --- |
| Claude Code | `claude --permission-mode=auto --dangerously-skip-permissions` |
| Codex | `codex --yolo --no-daemon` |
| OpenCode | `opencode --auto` |

Nesse modo o agente edita arquivos e roda comandos sem pedir confirmação.
Use em máquinas e pastas onde isso é aceitável para você. A skill compensa
com tarefas de escopo escrito (quais arquivos, se pode editar, como avisar o
fim) e leva para você qualquer pergunta que o agente ainda fizer.

## O que vem no repositório

| Caminho | Conteúdo |
| --- | --- |
| [`skills/herdrfy/SKILL.md`](skills/herdrfy/SKILL.md) | regras, passos, marcos e saída da skill |
| [`skills/herdrfy/references/`](skills/herdrfy/references/) | superfícies, agentes, Desktop, TUI, orquestração, configuração e instruções |
| [`skills/herdrfy/scripts/onde.mjs`](skills/herdrfy/scripts/onde.mjs) | localizador: onde o agente roda no Herdr |
| [`skills/herdrfy/scripts/diagnostico.mjs`](skills/herdrfy/scripts/diagnostico.mjs) | estado da instalação e pendências |
| [`skills/herdrfy/scripts/instrucoes.mjs`](skills/herdrfy/scripts/instrucoes.mjs) | bloco de instruções no `AGENTS.md` e no `CLAUDE.md` |
| [`skills/herdrfy/assets/`](skills/herdrfy/assets/) | texto do bloco e templates do herdr-core |
| [`docs/user/`](docs/user/README.md) | guia de uso para pessoas |
| [`CHANGELOG.md`](CHANGELOG.md) | histórico das versões |

Os scripts também rodam à mão:

```bash
node skills/herdrfy/scripts/onde.mjs --superficie desktop
node skills/herdrfy/scripts/diagnostico.mjs
node skills/herdrfy/scripts/instrucoes.mjs --check
```

## Guia

O guia em [`docs/user/`](docs/user/README.md) explica, para quem usa, as duas
superfícies, a localização, os agentes, os painéis e a configuração.

## Desenvolvimento

```bash
npm run validate
```

O comando confere a estrutura da skill, os links, o texto de instrução, os
comandos dos agentes, a versão no changelog e roda os testes dos scripts.
Não há dependências a instalar. As regras de contribuição para agentes estão
em [`AGENTS.md`](AGENTS.md) e o fluxo de publicação em
[`docs/user/07-publicacao.md`](docs/user/07-publicacao.md).

## Relação com as skills oficiais

O Herdr distribui duas skills próprias: `herdr` (TUI) e `herdr-core`
(Desktop e core). O Herdrfy não as substitui nem copia o texto delas. Ele
reúne o método de trabalho da Promovaweb sobre as duas superfícies e manda o
agente ler o manual embutido em cada binário (`herdr --skill`, `hc --skill`,
`herdr-app --skill`) quando precisa da sintaxe exata da versão instalada.

Herdr, herdr-core e Herdr Desktop são projetos de
[herdrdev](https://github.com/herdrdev). Este repositório não é afiliado a
eles.

## Licença

[MIT](LICENSE).
