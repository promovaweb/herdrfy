# Changelog

Todas as mudanças relevantes do Herdrfy são registradas neste arquivo. O
projeto segue versionamento semântico.

## [0.1.3](https://github.com/promovaweb/herdrfy/compare/v0.1.2...v0.1.3) (2026-11-11)

### Correções

- A confirmação do início da tarefa deixa de falar em "tela vazia": um agente recém-aberto pode mostrar o campo de entrada vazio antes de a tarefa do comando aparecer. O reenvio agora exige duas esperas seguidas sem a tarefa na tela.
- O diálogo de confiança da pasta passa a ser descrito como possível, não certo: numa pasta já aceita, Claude Code e Codex sobem direto.

### Documentação

- Explica o campo `ended` do `hc wait`, a equivalência entre `~/.agents/skills/herdrfy` e os links nas pastas dos agentes, e a frase que dispensa o agente auxiliar de carregar skill em tarefa pequena.

## [0.1.2](https://github.com/promovaweb/herdrfy/compare/v0.1.1...v0.1.2) (2026-11-11)

### Documentação

- README, guia e referência de configuração passam a mostrar a instalação com os agentes escolhidos por `-a` (`-a claude-code -a codex -a opencode`) e avisam que `-y` sem `-a` instala a skill na pasta de todos os agentes que o instalador conhece.

## [0.1.1](https://github.com/promovaweb/herdrfy/compare/v0.1.0...v0.1.1) (2026-11-11)

### Correções

- `npm run validate` e `npm test` passam a apontar os arquivos de teste (`tests/*.test.mjs`). No Node.js 22, `node --test tests/` tratava a pasta como módulo e os workflows `CI` e `Release` falhavam. A 0.1.0 ficou sem GitHub Release por esse motivo; o conteúdo da skill é o mesmo.

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
