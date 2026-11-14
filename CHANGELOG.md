# Changelog

Todas as mudanças relevantes do Herdrfy são registradas neste arquivo. O
projeto segue versionamento semântico.

## [0.3.2](https://github.com/promovaweb/herdrfy/compare/v0.3.1...v0.3.2) (2026-11-13)

### Documentação

- O guia de `docs/user/` passou a ser publicado em <https://promovaweb.com/docs/herdrfy/>. O botão Documentação do README e a seção Documentação apontam para essa página; a página da skill na Central de Skills continua citada.
- `CONTRIBUTING.md`: a seção de documentação registra onde o guia é publicado.
- Copy do guia de `docs/user/` revisada sob o contrato editorial da Promovaweb.

## [0.3.1](https://github.com/promovaweb/herdrfy/compare/v0.3.0...v0.3.1) (2026-11-13)

### Documentação

- Nova identidade visual: ícone, logotipo e kit de marca em `brand/`. O símbolo mostra painéis em grade, quatro painéis do Herdr com o agente em foco destacado em magenta e o cursor de terminal ativo.
- `brand/` traz o logo em SVG e PNG para fundo claro e escuro, favicons de 16 a 512 px, paleta com petróleo e turquesa da Promovaweb e acento magenta próprio, tokens, `global.css`, tema Tailwind, fontes, relatório de contraste, manifesto com hashes e guia visual.
- `README.md`: o cabeçalho abre com o logo do Herdrfy, que troca de versão conforme o tema, e traz a linha "Um projeto da Promovaweb".
- `CONTRIBUTING.md`: a tabela de estrutura e a de documentação citam `brand/`.

## [0.3.0](https://github.com/promovaweb/herdrfy/compare/v0.2.2...v0.3.0) (2026-11-13)

### Licença

- A partir desta versão, o projeto é distribuído sob a GNU AGPL 3.0; versões anteriores continuam sob a licença com que foram publicadas.
- `LICENSE` traz o texto oficial e integral da GNU Affero General Public License 3.0, no lugar da MIT.
- `package.json` declara `AGPL-3.0-only` no campo `license`.
- `README.md`: a seção Licença aponta para a AGPL 3.0 e avisa que a licença não concede o uso do nome e do logo do Herdrfy nem da marca Promovaweb (AGPL 3.0, seção 7, item e).
- `CONTRIBUTING.md`: as contribuições entram sob a mesma licença do projeto.

## [0.2.2](https://github.com/promovaweb/herdrfy/compare/v0.2.1...v0.2.2) (2026-11-13)

### Documentação

- `README.md` reorganizado para quem usa a skill: cabeçalho com o logo da Promovaweb, badges, banner do Discord e links para a documentação em <https://promovaweb.com/skills/herdrfy/>, para os planos e para o changelog. Ganha as seções Saída para scripts, Feito com (Herdr, herdr-core, Herdr Desktop, Node.js e Skills CLI, com os repositórios), Comunidade e suporte e Promovaweb.
- `CONTRIBUTING.md` concentra o que é de quem contribui: ambiente, organização do código, fluxo de trabalho, regras, validação, commits e releases. A estrutura de pastas e os comandos de desenvolvimento saem do README.
- `.markdownlint.json` libera os elementos HTML do cabeçalho desliga a regra do primeiro heading e aceita títulos repetidos em versões diferentes do changelog.

## [0.2.1](https://github.com/promovaweb/herdrfy/compare/v0.2.0...v0.2.1) (2026-11-13)

Esta versão muda o texto do bloco de instruções. Depois de atualizar a skill,
rode `node ~/.agents/skills/herdrfy/scripts/instructions.mjs` em cada projeto
com o bloco (e com `--global`, se gravou os arquivos globais), para receber o
aviso sobre terminal do herdr-core.

### Correções

- O localizador decide a superfície pela árvore de processos, do ancestral mais próximo para cima: processo `herdr-core` dá Desktop, processo `herdr` dá TUI. As variáveis de ambiente só decidem quando a árvore não tem nenhuma das duas. Um terminal do core que herdou `HERDR_ENV=1` e `HERDR_PANE_ID` de um TUI anterior deixava de ser lido como Desktop quando o ambiente vinha primeiro, e a aba pedida abria no TUI.
- A resposta do localizador traz `detection` com `process`, `env` e `inheritedEnv` nas duas superfícies e fora do Herdr. A saída em texto abre com uma linha `Warning:` quando as variáveis da outra superfície estão herdadas, dizendo qual comando chega onde.
- `inheritedEnv` inclui `HERDR_SOCKET_PATH` e `HC_TERMINAL_SOCKET`, as variáveis que levam os comandos `herdr` e `hc` aos seus servidores, e é medido contra a superfície da árvore de processos, não contra a pedida em `--surface`.
- `--surface` que contraria a árvore de processos mantém a superfície pedida, marca `mismatch: true` e avisa no texto que os comandos dessa superfície não chegam onde o agente roda.
- Na busca do TUI, quando a árvore de processos indica um terminal do core, o painel vindo de `HERDR_PANE_ID` não é aceito: a resposta é `found: false`, porque esse painel pertence a um TUI que não hospeda este processo.

- Conferido em sessão real do TUI aberta dentro de um terminal do core: o painel herdou `HC_TERMINAL_ID`, e o localizador respondeu TUI e achou o painel pelo processo. A 0.2.0 respondia Desktop nesse caso.

### Documentação

- `SKILL.md`, regras 1 a 4: o localizador decide pela árvore de processos, num terminal do core `herdr` não serve mesmo com `HERDR_ENV=1`, e a conferência de `detection` e `mismatch` vem antes de criar aba, painel ou espaço.
- `references/superficies.md`: ordem de detecção nova, o objeto `detection`, o campo `mismatch` e os exemplos de JSON com os campos novos.
- `assets/instrucoes-bloco.md`: o item da superfície avisa que, num terminal do herdr-core, `herdr` chega ao TUI e não à janela.
- Guia: `docs/user/02-superficies.md` explica por que a informação da pessoa importa quando as variáveis das duas superfícies convivem no mesmo terminal, e `docs/user/07-problemas-comuns.md` ganha a seção "Pedi uma aba no Desktop e ela abriu no TUI", com a causa e o que o agente faz agora.

### Build

- Testes do localizador com um `/proc` falso montado em pasta temporária: terminal do core com variáveis herdadas, painel do TUI com `HC_TERMINAL_ID` herdado, `--surface tui` dentro de um terminal do core e árvore sem `herdr` nem `herdr-core`. O localizador aceita `HERDRFY_PROC_ROOT` e `HERDRFY_PID` para isso, e os testes que dependem do ambiente usam uma tabela de processos vazia. A suíte passa de 18 para 22 testes.

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
