# Changelog

Todas as mudanças relevantes do Herdrfy são registradas neste arquivo. O
projeto segue versionamento semântico.

## [0.1.0](https://github.com/promovaweb/herdrfy/releases/tag/v0.1.0) (2026-11-11)

### Funcionalidades

- Skill `herdrfy`, orquestradora do Herdr nas duas superfícies: Herdr TUI (`herdr`) e Herdr Desktop com herdr-core (`hc` e `herdr-app`). A pessoa informa a superfície e a skill conduz localização, abertura de painéis, lançamento de agentes, acompanhamento, coleta de resultados e limpeza.
- Regra de lugar: todo painel novo abre na aba de quem pediu. No Desktop, pelos rótulos `herdr.space` e `herdr.tab` do próprio terminal; no TUI, pela divisão do próprio painel. Aba, espaço e workspace novos só a pedido, com `herdr-app` ou, sem ele na máquina, por rótulos do `hc`.
- Agentes sempre com as permissões liberadas, pelo comando completo e sem alias: `claude --permission-mode=auto --dangerously-skip-permissions`, `codex --yolo --no-daemon` e `opencode --auto`, com a forma de passar a primeira tarefa em cada um e o tratamento do diálogo de confiança da pasta.
- Script `onde.mjs`: informa terminal, espaço, aba e vizinhos no Desktop, ou workspace, aba e painel no TUI, em texto ou JSON. Aceita `--superficie` e ignora variáveis `HERDR_*` herdadas em terminais do herdr-core.
- Script `diagnostico.mjs`: lista binários, servidores, integrações do TUI, skills, templates, agentes e arquivos de configuração, com as pendências e o comando de cada uma.
- Script `instrucoes.mjs`: grava, confere e remove o bloco de instruções do Herdrfy no `AGENTS.md` e no `CLAUDE.md` do projeto ou nos arquivos globais dos agentes, entre marcadores e sem tocar no resto do arquivo. Avisa quando o arquivo, fora do bloco, manda iniciar agentes por alias.
- Templates do herdr-core `claude-yolo`, `codex-yolo` e `opencode-yolo`, com o comando completo de cada agente.

### Documentação

- Sete referências da skill: superfícies, agentes, Desktop, TUI, orquestração, configuração e instruções.
- Guia de uso em `docs/user/`, com oito capítulos.

### Build

- `npm run validate` confere estrutura da skill, links, texto de instrução, comandos dos agentes e versão, e roda os testes dos scripts. Workflows `CI` e `Release` no GitHub Actions.
