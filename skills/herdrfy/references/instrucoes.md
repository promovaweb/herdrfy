# Instruções no AGENTS.md e no CLAUDE.md

Agentes novos não carregam esta skill sozinhos. O bloco de instruções faz
com que qualquer agente aberto no projeto, por você ou pela pessoa, saiba
desde o primeiro turno: informar a superfície, localizar-se, abrir painel na
aba de quem pediu e iniciar outros agentes com as flags de permissão.

## Comando

```bash
node <skill>/scripts/instructions.mjs                      # projeto da pasta atual
node <skill>/scripts/instructions.mjs --project <pasta>    # outro projeto
node <skill>/scripts/instructions.mjs --global             # arquivos globais dos agentes
node <skill>/scripts/instructions.mjs --file <caminho>  # um arquivo específico
node <skill>/scripts/instructions.mjs --check              # só confere; sai com 1 se faltar
node <skill>/scripts/instructions.mjs --remove            # tira o bloco
node <skill>/scripts/instructions.mjs --json               # resposta em JSON
```

As opções combinam: `--global --check`, `--project x --remove`.

## O que o script faz

No projeto:

- `AGENTS.md` recebe o bloco. Se o arquivo não existe, é criado.
- `CLAUDE.md` recebe o bloco quando é um arquivo próprio. Quando é link para
  `AGENTS.md`, o arquivo real recebe o bloco uma vez. Quando não existe,
  nasce como link para `AGENTS.md`; se o sistema recusar o link, nasce como
  arquivo com o mesmo bloco.

Com `--global`, nas pastas de agente que já existem na máquina:

| Agente | Arquivo |
| --- | --- |
| Claude Code | `~/.claude/CLAUDE.md` |
| Codex | `~/.codex/AGENTS.md` |
| OpenCode | `~/.config/opencode/AGENTS.md` |

O bloco fica entre dois marcadores:

```markdown
<!-- herdrfy:start -->
...
<!-- herdrfy:end -->
```

Rodar de novo troca só o que está entre eles. O resto do arquivo não muda.
Um bloco gravado antes da versão 0.2.0, com os marcadores
`herdrfy:inicio` e `herdrfy:fim`, é reconhecido e regravado com os
marcadores atuais.
Sem bloco, ele entra no fim do arquivo. Não edite o texto entre os
marcadores à mão: a próxima execução sobrescreve. Regras próprias do projeto
ficam fora dos marcadores.

O texto vem de `assets/instrucoes-bloco.md`. O comando do localizador entra
com o caminho desta instalação: relativo quando a skill está dentro do
projeto, com `~` quando está na pasta pessoal.

## Estados da resposta

O script escreve um estado por arquivo, em inglês (campo `state` no JSON;
`pending` conta os arquivos que `--check` reprovou):

| Estado | Significado |
| --- | --- |
| `current` | o bloco está igual ao desta instalação |
| `outdated` | há um bloco, com texto ou marcadores antigos |
| `no block` | o arquivo existe sem bloco |
| `missing` | `CLAUDE.md` ainda não existe no projeto |
| `created`, `updated`, `removed` | o que a execução fez |
| `link to AGENTS.md` | `CLAUDE.md` aponta para o `AGENTS.md`, já tratado |
| `created as link to AGENTS.md` | `CLAUDE.md` nasceu como link |
| `agent not installed` | a pasta global daquele agente não existe |

## Quando rodar

- No pedido de configurar o Herdr num projeto.
- Depois de atualizar esta skill, para levar o bloco novo: `--check` mostra
  quem ficou para trás.
- Depois de mover a pasta da skill, porque o caminho do localizador muda.

## Antes de gravar

1. Rode `--check` e mostre à pessoa quais arquivos vão mudar.
2. Veja se a saída traz o aviso `warning: alias rule outside the block on
   lines ...` (campo `conflicts` no JSON). Ele aparece quando o arquivo, fora do
   bloco, manda iniciar agentes por alias (`zsh -ic`, `cc`, `cx`, `oc`).
   Duas regras opostas no mesmo arquivo deixam o próximo agente sem saber
   qual seguir. Mostre as linhas à pessoa e reescreva o trecho com os
   comandos completos quando ela confirmar, ou quando o pedido já for
   trocar os alias pelos comandos. O script não mexe fora do bloco.
3. Arquivos globais valem para todos os projetos da pessoa: grave com
   `--global` só quando ela pedir alcance global.
4. O script não faz commit. Informe os arquivos alterados e deixe o commit
   para o fluxo do projeto.

## Conteúdo do bloco

1. Localização com o comando do `where.mjs`, que detecta a superfície.
2. `herdr` no TUI, `hc` e `herdr-app` no Desktop; `--surface` quando a
   pessoa informar, e pergunta só quando a detecção falhar ou contrariar o
   pedido.
3. Painel novo na aba de quem pediu.
4. Tabela dos comandos completos de Claude Code, Codex e OpenCode com as
   flags de permissão.
5. Ler a tela antes de reenviar, responder ou resumir.
6. Encerrar só o que abriu; nunca parar servidor ou core.
