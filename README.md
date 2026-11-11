# Herdrfy

[![CI](https://github.com/promovaweb/herdrfy/actions/workflows/ci.yml/badge.svg)](https://github.com/promovaweb/herdrfy/actions/workflows/ci.yml)
[![Versão](https://img.shields.io/github/v/release/promovaweb/herdrfy?label=vers%C3%A3o)](https://github.com/promovaweb/herdrfy/releases/latest)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)](LICENSE)

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
- usa o herdr-core para comandos demorados, arquivos e terminais em outras
  máquinas;
- configura o Herdr: binários, skills oficiais, integrações, templates e
  arquivos de configuração;
- grava as regras no `AGENTS.md` e no `CLAUDE.md`, para os próximos agentes
  seguirem o mesmo método.

## Antes de instalar: permissões liberadas

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

## Instalar

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g
```

`-g` instala para todos os seus projetos. Sem `-g`, a skill entra só no
projeto atual. O instalador pergunta para quais agentes instalar. Para
responder no próprio comando, liste os agentes com `-a`:

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g -a claude-code -a codex -a opencode -y
```

Não use `-y` sem `-a`: o instalador cria a skill na pasta de todos os
agentes que ele conhece, mesmo os que você não tem.

Requisitos: Node.js 18 ou mais novo (para os scripts da skill) e ao menos um
dos produtos do Herdr instalado. A skill também orienta a instalação deles.

### Atualizar e remover

```bash
# Atualizar: o mesmo comando da instalação
npx skills add promovaweb/herdrfy --skill herdrfy -g

# Depois de atualizar, em cada projeto que tem o bloco de instruções
node ~/.agents/skills/herdrfy/scripts/instructions.mjs

# Remover
npx skills remove herdrfy -g
```

### Templates do herdr-core (opcional)

Quem usa o Herdr Desktop pode instalar os três templates da skill, que
guardam o comando completo de cada agente:

```bash
mkdir -p ~/.config/herdr-core/templates
cp ~/.agents/skills/herdrfy/assets/templates/*.md ~/.config/herdr-core/templates/
hc run --bg --name revisor claude-yolo "Revise só src/x.ts."
```

## Usar

Peça ao agente o que você quer. Ele detecta a superfície; se você disser
"estou no TUI" ou "estou no Desktop", a sua frase vale mais que a detecção.

- "Use herdrfy para abrir um Codex ao lado e pedir uma revisão do diff
  atual."
- "Estou no TUI. Use herdrfy para configurar o Herdr neste projeto e gravar
  as instruções no AGENTS.md."
- "Use herdrfy para abrir três agentes, um por pasta de `packages/`, e me
  trazer um resumo do que cada um encontrou."

O agente começa pelo localizador:

```text
Surface:   Herdr Desktop / herdr-core (use hc, not herdr)
Window:    herdr-app not on this machine; tabs and panes go through hc labels
Terminal:  t1s in promovaweb / docs
Space:     sp8ecd504c8ef5fec59681282f5b26d8c8
Tab:       tb7ec6e34ffe93cd49a498cc401f4596ab
Folder:    /home/ana/projeto
Program:   claude-code (working)
```

E termina com um relato curto, neste formato:

```text
Superfície: Herdr Desktop, terminal t1s em promovaweb / docs.
Aberto: revisor (t2a), painel na mesma aba, codex --yolo --no-daemon.
Resultado: 2 achados em /tmp/revisao.md; li o arquivo e conferi o primeiro no diff.
Encerrado: revisor. Nada ficou aberto.
Pendente: nada.
```

## O que vem no repositório

| Caminho | Conteúdo |
| --- | --- |
| [`skills/herdrfy/SKILL.md`](skills/herdrfy/SKILL.md) | regras, passos, marcos e saída da skill |
| [`skills/herdrfy/references/`](skills/herdrfy/references/) | superfícies, agentes, herdr-core, Desktop, TUI, orquestração, configuração e instruções |
| [`skills/herdrfy/scripts/where.mjs`](skills/herdrfy/scripts/where.mjs) | localizador: onde o agente roda no Herdr |
| [`skills/herdrfy/scripts/doctor.mjs`](skills/herdrfy/scripts/doctor.mjs) | estado da instalação e pendências |
| [`skills/herdrfy/scripts/instructions.mjs`](skills/herdrfy/scripts/instructions.mjs) | bloco de instruções no `AGENTS.md` e no `CLAUDE.md` |
| [`skills/herdrfy/assets/`](skills/herdrfy/assets/) | texto do bloco e templates do herdr-core |
| [`docs/user/`](docs/user/README.md) | guia de uso para pessoas |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | validação, versão e publicação |
| [`CHANGELOG.md`](CHANGELOG.md) | histórico das versões |

Os scripts são escritos em inglês, só leem o Herdr e também rodam à mão:

```bash
node skills/herdrfy/scripts/where.mjs --surface desktop
node skills/herdrfy/scripts/doctor.mjs
node skills/herdrfy/scripts/instructions.mjs --check
node skills/herdrfy/scripts/where.mjs --help
```

## Guia

O guia em [`docs/user/`](docs/user/README.md) explica, para quem usa, as duas
superfícies, a localização, os agentes, os painéis, a configuração e os
[problemas comuns](docs/user/07-problemas-comuns.md).

## Desenvolvimento

```bash
npm run validate
```

O comando confere a estrutura da skill, os links, o texto de instrução, os
comandos dos agentes, a versão no changelog e roda os testes dos scripts.
Não há dependências a instalar. As regras para agentes estão em
[`AGENTS.md`](AGENTS.md), e a validação e o fluxo de publicação, em
[`CONTRIBUTING.md`](CONTRIBUTING.md).

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
