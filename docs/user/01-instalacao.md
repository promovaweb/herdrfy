# Instalação

## Instalar a skill

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g
```

Com `-g`, a skill vale para todos os seus projetos. Sem `-g`, só para o
projeto atual. Para atualizar, rode o mesmo comando outra vez.

A skill usa scripts em Node.js 18 ou mais novo. Confira com `node --version`.

## Instalar o Herdr

Você precisa de ao menos um dos produtos:

| Produto | Instalação no Linux e no macOS |
| --- | --- |
| Herdr TUI | `curl -fsSL https://herdr.dev/install.sh \| sh` |
| Herdr Desktop (traz o herdr-core) | `curl -fsSL https://releases.herdr.dev/app/install.sh \| sh` |
| herdr-core sozinho, para servidor sem janela | `curl -fsSL https://releases.herdr.dev/core/install.sh \| sh` |

Se preferir, peça ao agente: "use herdrfy para conferir a instalação do
Herdr". Ele roda o diagnóstico, mostra o que falta e pede a sua confirmação
antes de instalar qualquer coisa.

## Conferir

Peça o diagnóstico ou rode você mesmo, a partir da pasta da skill:

```bash
node scripts/diagnostico.mjs
```

A saída mostra binários e versões, servidores em execução, integrações,
skills, templates e agentes encontrados, e termina com a lista de
pendências. Cada pendência vem com o comando que a resolve.

## Skills oficiais

O Herdr distribui duas skills próprias. Elas são opcionais para o Herdrfy,
que lê o manual embutido nos binários, mas vale instalar a do produto que
você usa:

```bash
npx skills add herdrdev/herdr --skill herdr -g
npx skills add herdrdev/herdr-core --skill herdr-core -g
```
