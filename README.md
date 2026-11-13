<p align="center">
  <a href="https://promovaweb.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://promovaweb.com/promovaweb-logo-dark-586.png">
      <img alt="Promovaweb" src="https://promovaweb.com/promovaweb-logo-light-586.png" width="240">
    </picture>
  </a>
</p>

<h1 align="center">Herdrfy</h1>

<p align="center">
  Ensina o seu agente de código a orquestrar o Herdr e os outros agentes, no Herdr TUI e no Herdr Desktop.
</p>

<p align="center">
  <a href="https://github.com/promovaweb/herdrfy/releases/latest"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/promovaweb/herdrfy"></a>
  <a href="LICENSE"><img alt="Licença" src="https://img.shields.io/github/license/promovaweb/herdrfy"></a>
  <a href="https://github.com/promovaweb/herdrfy/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/promovaweb/herdrfy/actions/workflows/ci.yml/badge.svg"></a>
</p>

<p align="center">
  <a href="https://promovaweb.com/discord"><img alt="Discord: obter ajuda e conversar com a Comunidade" src="https://img.shields.io/badge/Discord-Obter%20ajuda%20e%20conversar%20com%20a%20Comunidade-5865F2?style=for-the-badge&logo=discord&logoColor=white"></a>
</p>

<p align="center">
  <a href="https://promovaweb.com/skills/herdrfy/">Documentação</a> ·
  <a href="https://promovaweb.com/discord">Discord</a> ·
  <a href="https://promovaweb.com/planos?utm_source=github&utm_medium=readme&utm_campaign=herdrfy">Planos da Promovaweb</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

## O que é

O [Herdr](https://github.com/herdrdev/herdr) mantém terminais e agentes de código vivos e organizados. O Herdrfy é uma skill que ensina o seu agente a trabalhar dentro dele: saber onde está, abrir outro agente ao lado, passar uma tarefa, ler o resultado e encerrar o que abriu.

| Superfície | O que a pessoa vê | Comandos |
| --- | --- | --- |
| Herdr TUI | workspaces, abas e painéis dentro de um terminal | `herdr` |
| Herdr Desktop | janela com espaços, abas e painéis; os terminais vivem no herdr-core | `hc` para terminais e agentes, `herdr-app` para a janela |

Com a skill instalada, o agente:

- descobre a superfície e a posição dele: terminal, espaço e aba no Desktop; workspace, aba e painel no TUI;
- abre painéis na mesma aba de quem pediu. Abre aba, espaço ou workspace novo quando a pessoa pede;
- inicia Claude Code, Codex, OpenCode e outros agentes com as permissões liberadas, pelo comando completo, sem alias de shell;
- envia tarefas, lê a tela dos agentes, espera o fim do trabalho e confere o resultado antes de resumir;
- usa o herdr-core para comandos demorados, arquivos e terminais em outras máquinas;
- configura o Herdr: binários, skills oficiais, integrações, templates e arquivos de configuração;
- grava as regras no `AGENTS.md` e no `CLAUDE.md`, para os próximos agentes seguirem o mesmo método.

## Instalação

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g
```

`-g` instala para todos os seus projetos. Sem `-g`, a skill entra só no projeto atual. O instalador pergunta para quais agentes instalar. Para responder no próprio comando, liste os agentes com `-a`:

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g -a claude-code -a codex -a opencode -y
```

Não use `-y` sem `-a`: o instalador cria a skill na pasta de todos os agentes que ele conhece, mesmo os que você não tem.

Requisitos: Node.js 18 ou mais novo, para os scripts da skill, além de ao menos um produto do Herdr instalado. A instalação do Herdr vem dos instaladores de [herdr.dev](https://herdr.dev). A skill orienta o passo a passo.

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

Quem usa o Herdr Desktop pode copiar os três templates da skill, que guardam o comando completo de cada agente:

```bash
mkdir -p ~/.config/herdr-core/templates
cp ~/.agents/skills/herdrfy/assets/templates/*.md ~/.config/herdr-core/templates/
hc run --bg --name revisor claude-yolo "Revise só src/x.ts."
```

## Primeiros passos

Peça ao agente o que você quer. Ele detecta a superfície. Se você disser que está no TUI ou no Desktop, a sua frase vale mais que a detecção.

```text
Use herdrfy para abrir um Codex ao lado e pedir uma revisão do diff atual.
```

O agente começa pelo localizador. Quando o pedido for configurar a máquina, ele roda o diagnóstico antes:

```bash
node ~/.agents/skills/herdrfy/scripts/where.mjs
node ~/.agents/skills/herdrfy/scripts/doctor.mjs
```

O diagnóstico lista binários, servidores, integrações, skills, templates e agentes, com as pendências e o comando de cada uma. O localizador responde onde o agente roda:

```text
Surface:   Herdr Desktop / herdr-core (use hc, not herdr)
Window:    herdr-app not on this machine; tabs and panes go through hc labels
Terminal:  t1s in promovaweb / docs
Space:     sp8ecd504c8ef5fec59681282f5b26d8c8
Tab:       tb7ec6e34ffe93cd49a498cc401f4596ab
Folder:    /home/ana/projeto
Program:   claude-code (working)
```

## Uso

Peça em português, com o resultado que você espera:

- "Use herdrfy para abrir um Codex ao lado e pedir uma revisão do diff atual."
- "Estou no TUI. Use herdrfy para configurar o Herdr neste projeto e gravar as instruções no AGENTS.md."
- "Use herdrfy para abrir três agentes, um por pasta de `packages/`. Depois me traga um resumo do que cada um encontrou."

No fim, o agente relata o que abriu, o resultado de cada agente e o que ficou pendente:

```text
Superfície: Herdr Desktop, terminal t1s em promovaweb / docs.
Aberto: revisor (t2a), painel na mesma aba, codex --yolo --no-daemon.
Resultado: 2 achados em /tmp/revisao.md; li o arquivo e conferi o primeiro no diff.
Encerrado: revisor. Nada ficou aberto.
Pendente: nada.
```

### Scripts à mão

Os scripts também rodam fora do agente. Eles só leem o Herdr e aceitam `--help`:

```bash
node ~/.agents/skills/herdrfy/scripts/where.mjs --surface desktop
node ~/.agents/skills/herdrfy/scripts/doctor.mjs --json
node ~/.agents/skills/herdrfy/scripts/instructions.mjs --check
```

## Uso com agentes

O agente lê [`skills/herdrfy/SKILL.md`](skills/herdrfy/SKILL.md) e as referências da pasta ao lado. O manual embutido em cada binário acompanha a versão instalada, então vale mais que a skill quando houver diferença de sintaxe: `herdr --skill`, `hc --skill` e `herdr-app --skill`.

O Herdr distribui duas skills próprias: `herdr` (TUI) e `herdr-core` (Desktop e core). O Herdrfy não as substitui nem copia o texto delas. Ele reúne o método de trabalho da Promovaweb sobre as duas superfícies.

Todo agente é iniciado pelo comando completo, com as permissões liberadas:

| Agente | Comando |
| --- | --- |
| Claude Code | `claude --permission-mode=auto --dangerously-skip-permissions` |
| Codex | `codex --yolo --no-daemon` |
| OpenCode | `opencode --auto` |

Nesse modo o agente edita arquivos e roda comandos sem pedir confirmação. Use em máquinas e pastas onde isso é aceitável para você. A skill compensa com tarefas de escopo escrito e leva para você qualquer pergunta que o agente ainda fizer.

Para os próximos agentes seguirem o mesmo método, grave o bloco de instruções no projeto:

```bash
cd /caminho/do/projeto
node ~/.agents/skills/herdrfy/scripts/instructions.mjs --check
node ~/.agents/skills/herdrfy/scripts/instructions.mjs
```

O bloco fica entre os marcadores `<!-- herdrfy:start -->` e `<!-- herdrfy:end -->` no `AGENTS.md` e no `CLAUDE.md`. Ele é trocado a cada execução sem tocar no resto do arquivo. Com `--global`, ele vai para os arquivos globais dos agentes.

## Saída para scripts

Os três scripts aceitam `--json` e devolvem a resposta em inglês, como os binários do Herdr.

| Script | Código 0 | Código 1 | Código 2 |
| --- | --- | --- | --- |
| `where.mjs` | resposta obtida | não conseguiu ler o Herdr | argumento inválido |
| `doctor.mjs` | conferência feita | não se aplica | argumento inválido |
| `instructions.mjs` | bloco gravado ou atual | `--check` achou arquivo sem o bloco atual | argumento inválido |

## Documentação

- Guia de uso no site: <https://promovaweb.com/skills/herdrfy/>.
- Guia em Markdown: [`docs/user/`](docs/user/README.md), com a visão geral, a instalação, as superfícies, a localização, os agentes, os painéis, a configuração e os problemas comuns.
- Manual embutido: `node ~/.agents/skills/herdrfy/scripts/where.mjs --help` e os demais scripts com `--help`.
- Portal do Herdr na Promovaweb: <https://promovaweb.com/herdr/>.

## Feito com

| Projeto | Para quê |
| --- | --- |
| [Herdr](https://github.com/herdrdev/herdr) | multiplexador de terminal para agentes de código, no Herdr TUI |
| [herdr-core](https://github.com/herdrdev/herdr-core) | terminais dos agentes no Desktop |
| [Herdr Desktop](https://github.com/herdrdev/herdr-app) | janela do Desktop |
| [Node.js](https://github.com/nodejs/node) | execução dos scripts da skill |
| [Skills CLI](https://github.com/vercel-labs/skills) | instalação da skill com `npx skills` |

Herdr, herdr-core e Herdr Desktop são projetos de [herdrdev](https://github.com/herdrdev). Este repositório não é afiliado a eles.

## Comunidade e suporte

- **Discord:** [obter ajuda e conversar com a Comunidade](https://promovaweb.com/discord).
- **Bugs e pedidos:** abra uma [issue](https://github.com/promovaweb/herdrfy/issues) com a versão, o sistema operacional e o passo a passo para reproduzir.
- **Novidades:** acompanhe o [CHANGELOG](CHANGELOG.md) e as [releases](https://github.com/promovaweb/herdrfy/releases).

## Contribuir

O repositório aceita correções de texto, referências e scripts. Leia o [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de abrir uma issue ou um pull request.

## Promovaweb

O Herdrfy é mantido pela [Promovaweb](https://promovaweb.com), comunidade de co-working digital onde profissionais aprendem a construir, automatizar e gerir negócios de tecnologia e IA com aulas ao vivo, Co-works e revisão de projetos reais.

Quer usar o Herdrfy em projetos de verdade, com acompanhamento? Conheça os [planos da Promovaweb](https://promovaweb.com/planos?utm_source=github&utm_medium=readme&utm_campaign=herdrfy).

## Licença

[MIT](LICENSE).
