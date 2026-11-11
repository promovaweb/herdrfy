# Changelog

Todas as mudanças relevantes do Herdrfy são registradas neste arquivo. O
projeto segue versionamento semântico.

## [0.2.0](https://github.com/promovaweb/herdrfy/compare/v0.1.3...v0.2.0) (2026-11-11)

Esta versão troca nomes de scripts, opções, chaves do JSON e marcadores.
Quem já instalou precisa, depois de atualizar a skill, rodar
`node ~/.agents/skills/herdrfy/scripts/instructions.mjs` em cada projeto com
o bloco de instruções (e com `--global`, se gravou os arquivos globais), para
o bloco apontar para o localizador novo.

### Funcionalidades

- Scripts em inglês, do nome do arquivo às mensagens: `onde.mjs` vira `where.mjs`, `diagnostico.mjs` vira `doctor.mjs` e `instrucoes.mjs` vira `instructions.mjs`. As opções passam a ser `--surface`, `--project`, `--file` e `--remove`, e as chaves do JSON seguem o mesmo idioma (`surface`, `found`, `terminal.space`, `terminal.tab`, `neighbors`, `pending`, `files`, `state`, `conflicts`). Skill, referências, guia e README continuam em português.
- Os marcadores do bloco de instruções passam a ser `<!-- herdrfy:start -->` e `<!-- herdrfy:end -->`. Um bloco gravado com `herdrfy:inicio` e `herdrfy:fim` é reconhecido, aparece como `outdated` no `--check` e é regravado com os marcadores novos, sem duplicar.
- O localizador informa `terminal.placement` no Desktop: `tab` (rótulos `herdr.space` e `herdr.tab` presentes), `unlabeled` (só o rótulo `where`) ou `none`. Informa também `terminal.identity`, copiado do `hc get`.
- Regra nova na skill para terminal sem aba: o que o agente abre fica como auxiliar sem rótulos, com aviso à pessoa, sem copiar rótulos de outro terminal nem montar IDs a partir do texto de `where`.
- Referência nova `references/herdr-core.md`, com os comandos do `hc`: terminais, lançamento, templates, esperas e seus retornos, mensagens entre agentes, comandos demorados, `exec` e `file`, outras máquinas, servidor e limpeza. `references/desktop.md` passa a tratar só da janela: rótulos, painéis, abas e espaços.
- Os três scripts aceitam `--help` e saem com código 2 para argumento desconhecido.

### Correções

- Um terminal com o rótulo `where` e sem `herdr.space` e `herdr.tab` deixava de ser descrito como "fora da janela". O caso apareceu num terminal com `identity: herdr-mobile`, mostrado como `herdrfy / main`.
- `--help` no localizador e no diagnóstico rodava a consulta normal; argumento desconhecido era ignorado nos dois.
- O bloco de instruções mandava perguntar a superfície sempre que a pessoa não a informasse, ao contrário da regra 1 da skill. O bloco agora manda rodar o localizador, que detecta a superfície, e perguntar só quando a detecção falha ou contraria o pedido.
- A procura de executáveis no `PATH` deixa de depender do comando `which`.

### Documentação

- A leitura dos sinais logo depois de lançar um agente fica num lugar só, a seção "Confirmar que a tarefa começou" de `references/orquestracao.md`, com o Herdr TUI no mesmo nível de detalhe do Desktop. `SKILL.md`, `agentes.md` e `herdr-core.md` apontam para ela.
- Guia: os comandos dos scripts trazem o caminho da instalação (`~/.agents/skills/herdrfy/scripts/`), há um capítulo novo de problemas comuns, e os capítulos de superfícies, localização e painéis tratam do terminal aberto fora da janela.
- O fluxo de publicação sai do guia de uso e vai para `CONTRIBUTING.md`, junto com a regra de idioma e a validação.
- README: aviso das permissões liberadas antes da instalação, comandos de atualização e remoção, instalação dos templates, exemplo da saída do localizador e do relato final, e selos de CI, versão e licença.

### Build

- `scripts/validar.mjs` vira `scripts/validate.mjs` e reprova Markdown que ainda cite um nome anterior à 0.2.0.
- Testes do localizador com `hc` e `herdr` falsos no `PATH`: terminal em aba, sem rótulos de aba, sem rótulos, fora de um terminal do core, painel do TUI e falha de leitura. A suíte passa de 9 para 18 testes.

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
