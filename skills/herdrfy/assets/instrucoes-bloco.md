## Herdr (Herdrfy)

Este ambiente usa a skill `herdrfy` para trabalhar no Herdr. Carregue a skill
antes de controlar terminais, painéis, abas, espaços ou outros agentes.

1. **Superfície.** A pessoa informa se está no Herdr TUI ou no Herdr Desktop.
   No TUI o comando é `herdr`. No Desktop o comando é `hc` (herdr-core), com
   `herdr-app` para a janela quando ele existe na máquina. Sem essa
   informação, pergunte uma vez na sessão.
2. **Localização.** Antes do primeiro comando do Herdr, rode o localizador com
   a superfície informada e use os IDs que ele devolve:

   ```bash
   {{ONDE}} --superficie desktop   # ou tui
   ```

   As variáveis `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID` e `HERDR_PANE_ID` ficam
   velhas quando o painel muda de lugar.
3. **Mesma aba.** Painel novo abre na aba de quem pediu. Aba, espaço ou
   workspace novo só quando a pessoa pedir.
4. **Agentes com permissões liberadas.** Inicie todo agente pelo comando
   completo, com as flags abaixo, sem alias de shell:

   | Agente | Desktop (`hc`) | TUI (`herdr agent start ... --`) |
   | --- | --- | --- |
   | Claude Code | `claude --permission-mode=auto --dangerously-skip-permissions` | `--permission-mode=auto --dangerously-skip-permissions` |
   | Codex | `codex --yolo --no-daemon` | `--yolo` |
   | OpenCode | `opencode --auto` | `--auto` |

   Para outro agente, leia o `--help` dele e use a flag que libera as
   permissões.
5. **Ler antes de agir.** Leia a tela do agente antes de reenviar uma tarefa,
   responder a um diálogo ou resumir um resultado.
6. **Limpeza.** Encerre só o que você abriu. Nunca pare o servidor do Herdr
   ou o core da pessoa.
