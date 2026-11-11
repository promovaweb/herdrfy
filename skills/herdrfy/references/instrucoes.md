# Instruções no AGENTS.md e no CLAUDE.md

Agentes novos não carregam esta skill sozinhos. O bloco de instruções faz
com que qualquer agente aberto no projeto, por você ou pela pessoa, saiba
desde o primeiro turno: informar a superfície, localizar-se, abrir painel na
aba de quem pediu e iniciar outros agentes com as flags de permissão.

## Comando

```bash
node <skill>/scripts/instrucoes.mjs                      # projeto da pasta atual
node <skill>/scripts/instrucoes.mjs --projeto <pasta>    # outro projeto
node <skill>/scripts/instrucoes.mjs --global             # arquivos globais dos agentes
node <skill>/scripts/instrucoes.mjs --arquivo <caminho>  # um arquivo específico
node <skill>/scripts/instrucoes.mjs --check              # só confere; sai com 1 se faltar
node <skill>/scripts/instrucoes.mjs --remover            # tira o bloco
node <skill>/scripts/instrucoes.mjs --json               # resposta em JSON
```

As opções combinam: `--global --check`, `--projeto x --remover`.

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
<!-- herdrfy:inicio -->
...
<!-- herdrfy:fim -->
```

Rodar de novo troca só o que está entre eles. O resto do arquivo não muda.
Sem bloco, ele entra no fim do arquivo. Não edite o texto entre os
marcadores à mão: a próxima execução sobrescreve. Regras próprias do projeto
ficam fora dos marcadores.

O texto vem de `assets/instrucoes-bloco.md`. O comando do localizador entra
com o caminho desta instalação: relativo quando a skill está dentro do
projeto, com `~` quando está na pasta pessoal.

## Quando rodar

- No pedido de configurar o Herdr num projeto.
- Depois de atualizar esta skill, para levar o bloco novo: `--check` mostra
  quem ficou para trás.
- Depois de mover a pasta da skill, porque o caminho do localizador muda.

## Antes de gravar

1. Rode `--check` e mostre à pessoa quais arquivos vão mudar.
2. Veja se a saída traz o aviso `regra de alias fora do bloco nas linhas
   ...` (campo `conflitos` no JSON). Ele aparece quando o arquivo, fora do
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

1. Superfície informada pela pessoa; `herdr` no TUI, `hc` e `herdr-app` no
   Desktop.
2. Localização com o comando do `onde.mjs`.
3. Painel novo na aba de quem pediu.
4. Tabela dos comandos completos de Claude Code, Codex e OpenCode com as
   flags de permissão.
5. Ler a tela antes de reenviar, responder ou resumir.
6. Encerrar só o que abriu; nunca parar servidor ou core.
