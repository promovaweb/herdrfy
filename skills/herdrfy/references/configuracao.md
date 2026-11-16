# Instalação e configuração

Comece pelo diagnóstico. Ele só lê e lista as pendências, na seção
`Pending` (campo `pending` no JSON), com o comando de cada uma:

```bash
node <skill>/scripts/doctor.mjs
node <skill>/scripts/doctor.mjs --json
```

Instalar binário, instalar skill global e editar arquivo de configuração da
pessoa mudam a máquina dela: confirme antes, salvo quando o pedido já for
exatamente esse. Mostre o comando que vai rodar.

## 1. Binários

| Produto | Linux e macOS | Atualizar |
| --- | --- | --- |
| Herdr TUI (`herdr`) | `curl -fsSL https://herdr.dev/install.sh \| sh` | `herdr update` |
| Herdr Desktop (`herdr-app`, instala o herdr-core junto) | `curl -fsSL https://releases.herdr.dev/app/install.sh \| sh` | pela própria janela |
| herdr-core sozinho (`hc`), para servidor sem janela | `curl -fsSL https://releases.herdr.dev/core/install.sh \| sh` | `hc update` |

No macOS também existe `brew install herdr`, e no macOS com Apple Silicon,
`brew install --cask herdr-app`. No Windows, em PowerShell:

| Produto | Windows |
| --- | --- |
| Herdr TUI | `powershell -ExecutionPolicy Bypass -c "irm https://herdr.dev/install.ps1 \| iex"` |
| Herdr Desktop | `irm https://releases.herdr.dev/app/install.ps1 \| iex` |
| herdr-core sozinho | `powershell -c "irm https://releases.herdr.dev/core/install.ps1 \| iex"` |

O instalador do Desktop instala também o herdr-core quando ele falta.
Instalações feitas por gerenciador de pacotes atualizam por ele.

O localizador e o diagnóstico mostram esses comandos sozinhos quando o
Herdr falta: o localizador na lista `install`, para o sistema da pessoa, e o
diagnóstico em `Pending`. Diga à pessoa que o Herdr não está instalado,
mostre os comandos da superfície que ela quer e rode só com o aceite dela.
Os instaladores baixam e executam código: ofereça também ler o script antes.

Confira depois: `herdr --version`, `hc --version`, `herdr-app status`.

A pessoa não deve abrir `herdr` de dentro de um painel do próprio Herdr: o
TUI recusa execução aninhada.

## 2. Skills

Esta skill e as duas oficiais instalam pelo `npx skills`:

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g
npx skills add herdrdev/herdr --skill herdr -g
npx skills add herdrdev/herdr-core --skill herdr-core -g
```

`-g` instala para todos os projetos da pessoa. Sem `-g`, a skill entra só no
projeto atual. Para atualizar, rode o mesmo comando de novo.

Sem terminal interativo, o instalador precisa de `-y`. Nesse caso passe
sempre os agentes com `-a`, um por agente presente na máquina:

```bash
npx skills add promovaweb/herdrfy --skill herdrfy -g -a claude-code -a codex -a opencode -y
```

`-y` sem `-a` instala a skill na pasta de todos os agentes que o instalador
conhece, dezenas deles, e cria essas pastas na pasta pessoal. Para desfazer:
`npx skills remove <skill> -g -y` e instale de novo com `-a`. Instale a
oficial de cada produto que existe na máquina; o Herdrfy funciona sem elas,
porque lê o manual embutido nos binários.

## 3. Integrações do TUI

As integrações informam ao Herdr TUI o estado e a sessão de cada agente:

```bash
herdr integration status
herdr integration status --outdated-only
herdr integration install claude
herdr integration install codex
herdr integration install opencode
```

Instale só para os agentes presentes na máquina. Cada instalação grava um
gancho na pasta de configuração daquele agente; o caminho aparece na saída
de `integration status`. Agentes já abertos precisam ser reiniciados para
carregar o gancho.

Depois de `herdr update`, rode `herdr integration status --outdated-only` e
reinstale o que aparecer. Na 0.9.5, o Herdr deixou de gravar ganchos de
turno no Codex, que geravam o aviso "clamping Interrupt hook timeout" ao
abrir, e voltou a ler o estado do Codex pela tela: quem instalou antes roda
`herdr integration install codex` para tirar o gancho antigo.

## 4. Templates do herdr-core

Um template guarda o comando de um agente, com as flags, e as instruções de
abertura. Os três desta skill ficam em `assets/templates/`:

| Template | Comando |
| --- | --- |
| `claude-yolo` | `claude --permission-mode=auto --dangerously-skip-permissions` |
| `codex-yolo` | `codex --yolo --no-daemon` |
| `opencode-yolo` | `opencode --auto` |

Instalar:

```bash
mkdir -p ~/.config/herdr-core/templates
cp <skill>/assets/templates/*.md ~/.config/herdr-core/templates/
hc templates
```

Com `XDG_CONFIG_HOME` definido, a pasta é
`$XDG_CONFIG_HOME/herdr-core/templates`. No Windows,
`%APPDATA%\herdr-core\templates`. Antes de copiar, veja se já existe um
arquivo com o mesmo nome e preserve o da pessoa.

Usar:

```bash
hc run --bg --name revisor --cwd "$PWD" \
  --label herdr.space=<seu-espaço> --label herdr.tab=<sua-aba> \
  claude-yolo "Revise só src/x.ts. Avise com hc send $HC_TERMINAL_ID."
```

Formato do arquivo: cabeçalho entre duas linhas `---`, com `command`
(obrigatório), `description` e, quando preciso, `ready: quiet`, `submit`,
`stop` e `paste_gap_ms`. O cabeçalho é lido linha a linha, sem aspas de YAML
e sem valores de várias linhas. O nome do template é o nome do arquivo. O
corpo vira a abertura da primeira mensagem, e a tarefa entra depois de uma
linha em branco. Não dê a um template o nome de um programa (`claude`,
`codex`), porque `hc run claude` passaria a abrir o template.

Num terminal aberto em outra máquina com `--on`, o template e o agente
precisam existir lá.

## 5. Arquivos de configuração

### Herdr TUI: `~/.config/herdr/config.toml`

```bash
herdr --default-config          # todas as chaves, comentadas
herdr config check              # valida o arquivo
herdr server reload-config      # aplica no servidor em execução
```

Áreas principais: `[theme]` (tema e cores), `[keys]` (prefixo, atalhos e
comandos próprios), `[ui]` (barra lateral, bordas, avisos, sons),
`[terminal]` (shell e pasta inicial dos painéis), `[session]` (retomada dos
agentes depois de reiniciar), `[update]` (canal).

Fluxo de edição: copie o arquivo para um backup com data, altere só a chave
pedida, rode `herdr config check` e depois `herdr server reload-config`. Se
a checagem acusar erro, volte ao backup. Não invente chave: confirme o nome
em `herdr --default-config`. `HERDR_CONFIG_PATH` troca o caminho do arquivo.

### herdr-core: `~/.config/herdr-core/config.toml`

O arquivo é opcional. Os comandos do core estão em
[herdr-core.md](herdr-core.md). Chaves:

| Chave | Efeito |
| --- | --- |
| `shell = ["nu"]` | shell dos terminais novos; cada item é um argumento |
| `wait_timeout = 180` | segundos até uma espera devolver o aviso de tempo |
| `notes = false` | o core deixa de digitar notas e marcas `<hc>` nos terminais |
| `notes_quiet = 3` | segundos de silêncio antes de uma nota ao pai |
| `draft_wait = 60` | segundos que um rascunho da pessoa segura envios e notas; `0` deixa só a pausa curta |
| `restore_screen = true` | depois de uma recuperação (`keep`), mostra a última tela do programa perdido acima do shell novo; desligado por padrão |

As mudanças valem no próximo terminal ou na próxima entrega, sem reiniciar o
core. Com `restore_screen = true`, `hc read` traz também o texto restaurado,
abaixo de um divisor: só o texto depois do divisor é saída nova. `notes = false` desliga os avisos entre agentes de que a orquestração
desta skill depende; só mude a pedido.

### Herdr Desktop: `~/.config/herdr-app/`

A pasta guarda `keys.json`, layouts, temas e mods, e um guia gerado em
`AGENTS.md`. Para qualquer mudança ali, leia antes `herdr-app --skill` e
esse guia. Regras de lá que valem repetir: duplique layout ou mod de fábrica
antes de editar (`layout.clone`, `mod.clone`), rode `herdr-app check` depois
de mexer num mod e confirme o resultado com `herdr-app status` e
`herdr-app shot`.

### Preferência de painel ou aba

Quando a pessoa fixar onde quer os terminais novos ("sempre em aba",
"sempre na mesma aba"), ofereça gravar a preferência. O localizador lê o
arquivo e devolve a escolha em `preference` e em `advice`:

```bash
mkdir -p ~/.config/herdrfy
printf '{"open":"tab"}\n' > ~/.config/herdrfy/config.json
```

| `open` | Efeito |
| --- | --- |
| `auto` | padrão: o tamanho do painel e a ocupação da aba decidem |
| `pane` | painel na aba de quem pediu, sempre que houver aba para repetir |
| `tab` | aba nova no espaço ou workspace de quem pediu |

Com `XDG_CONFIG_HOME` definido, a pasta é `$XDG_CONFIG_HOME/herdrfy`.
`HERDRFY_CONFIG` aponta outro arquivo. Um pedido da pessoa numa tarefa vale
mais que a preferência gravada. No Desktop, um terminal sem rótulos de aba
continua abrindo auxiliares, qualquer que seja a preferência.

## 6. Instruções do projeto

Grave o bloco do Herdrfy no `AGENTS.md` e no `CLAUDE.md` para que todo
agente aberto ali siga as mesmas regras. Ver [instrucoes.md](instrucoes.md).

## 7. Conferência final

```bash
node <skill>/scripts/doctor.mjs
node <skill>/scripts/where.mjs --surface <tui|desktop>
node <skill>/scripts/instructions.mjs --check
```

A configuração está completa quando o diagnóstico não lista pendências dos
produtos que a pessoa usa, o localizador responde com a posição e o bloco de
instruções está em dia.
