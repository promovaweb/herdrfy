# Configuração

Peça: "use herdrfy para configurar o Herdr". O agente roda o diagnóstico,
mostra as pendências e resolve cada uma com a sua confirmação.

## Integrações do TUI

As integrações contam ao Herdr TUI o estado e a sessão de cada agente:

```bash
herdr integration status
herdr integration install claude
herdr integration install codex
herdr integration install opencode
```

Reinicie os agentes que já estavam abertos para carregar a integração.

## Templates do herdr-core

Um template guarda o comando de um agente e as instruções de abertura. O
Herdrfy traz três, com as permissões liberadas: `claude-yolo`, `codex-yolo`
e `opencode-yolo`. Depois de copiados para `~/.config/herdr-core/templates/`,
iniciar um agente fica assim:

```bash
hc run --bg --name revisor claude-yolo "Revise só src/x.ts."
```

## Arquivos de configuração

| Produto | Arquivo | Como conferir |
| --- | --- | --- |
| Herdr TUI | `~/.config/herdr/config.toml` | `herdr config check` |
| herdr-core | `~/.config/herdr-core/config.toml` | opcional; vale no próximo terminal |
| Herdr Desktop | `~/.config/herdr-app/` | `herdr-app status` |

Para mudar tema, atalhos ou barra lateral do TUI, diga o que quer. O agente
faz backup do arquivo, altera só a chave pedida, valida e recarrega com
`herdr server reload-config`.

## Instruções do projeto

Agentes novos não conhecem a skill. Para que todo agente aberto no projeto
siga as mesmas regras, peça: "grave as instruções do Herdr no AGENTS.md".

```bash
cd /caminho/do/projeto
node ~/.agents/skills/herdrfy/scripts/instructions.mjs --check
node ~/.agents/skills/herdrfy/scripts/instructions.mjs
```

O bloco entra no `AGENTS.md` e no `CLAUDE.md`, entre dois marcadores:

```markdown
<!-- herdrfy:start -->
...
<!-- herdrfy:end -->
```

Rodar de novo atualiza só o que está entre eles. O que você escreveu fora
dos marcadores não muda. Para valer em todos os projetos, use `--global`;
para tirar, `--remove`.

Rode o comando de novo depois de atualizar a skill: `--check` responde
`outdated` nos arquivos que ficaram com o bloco antigo. Blocos gravados antes
da versão 0.2.0 usavam os marcadores `herdrfy:inicio` e `herdrfy:fim`; o
script reconhece e regrava com os atuais.

Se o seu `AGENTS.md` já tem regras de Herdr escritas à mão que dizem o
contrário do bloco, o agente aponta as linhas e pergunta qual fica.
