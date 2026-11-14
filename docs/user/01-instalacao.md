# Instalação

## Instalar a skill

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g
```

Com `-g`, a skill vale para todos os seus projetos. Sem `-g`, vale só para o
projeto atual. O instalador pergunta para quais agentes instalar. Você pode
responder no próprio comando com a lista de agentes em `-a`:

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g -a claude-code -a codex -a opencode -y
```

Não use `-y` sem `-a`: o instalador cria a skill na pasta de todos os
agentes que ele conhece, mesmo os que você não tem. Para atualizar, rode o
mesmo comando outra vez. Para remover, use `npx skills remove herdrfy -g`.

A skill usa scripts em Node.js 18 ou mais novo. Confira com `node --version`.

Depois de atualizar a skill, rode o script de instruções de novo nos
projetos que já têm o bloco do Herdrfy (ver
[Configuração](06-configuracao.md#instruções-do-projeto)).

## Onde a skill fica

O instalador guarda a skill em `~/.agents/skills/herdrfy` (com `-g`) ou em
`.agents/skills/herdrfy` dentro do projeto. Depois cria um link em cada pasta de
agente, como `~/.claude/skills/herdrfy`. Os comandos deste guia usam o
caminho da instalação global.

## Instalar o Herdr

Você precisa de ao menos um dos produtos:

| Produto | Instalação no Linux e no macOS |
| --- | --- |
| Herdr TUI | `curl -fsSL https://herdr.dev/install.sh \| sh` |
| Herdr Desktop (traz o herdr-core) | `curl -fsSL https://releases.herdr.dev/app/install.sh \| sh` |
| herdr-core sozinho, para servidor sem janela | `curl -fsSL https://releases.herdr.dev/core/install.sh \| sh` |

Se preferir, diga ao agente: "use herdrfy para conferir a instalação do
Herdr". Ele roda o diagnóstico, mostra o que falta e aguarda a sua confirmação
antes de instalar qualquer coisa.

## Conferir

Peça o diagnóstico ou rode você mesmo:

```bash
node ~/.agents/skills/herdrfy/scripts/doctor.mjs
```

A saída vem em inglês, como a de todos os scripts da skill. Ela mostra os
binários com as versões, os servidores em execução e as integrações, seguidos
das skills, dos templates e dos agentes. O relatório termina com a lista de
pendências (`Pending`), cada uma com o comando que a resolve.

## Templates do herdr-core

No Herdr Desktop, você pode copiar os três templates da skill, que guardam o
comando completo de cada agente:

```bash
mkdir -p ~/.config/herdr-core/templates
cp ~/.agents/skills/herdrfy/assets/templates/*.md ~/.config/herdr-core/templates/
hc templates
```

Se já existir um arquivo seu com o mesmo nome na pasta, guarde uma cópia
antes.

## Skills oficiais

O Herdr distribui duas skills próprias. Elas são opcionais para o Herdrfy,
que lê o manual embutido nos binários, mas vale instalar a do produto que
você usa:

```bash
npx skills add herdrdev/herdr --skill herdr -g
npx skills add herdrdev/herdr-core --skill herdr-core -g
```
