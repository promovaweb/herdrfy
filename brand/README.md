# Marca Herdrfy

O Herdrfy é a skill que ensina o seu agente de código a trabalhar dentro do
Herdr: saber onde está, abrir outro agente ao lado, passar uma tarefa, ler o
resultado e encerrar o que abriu. Sua identidade combina o petróleo e o
turquesa da Promovaweb com magenta, cor própria que marca o agente em foco.

## Conceito visual

O símbolo mostra **painéis em grade**: quatro painéis do Herdr, três em
contorno turquesa e um preenchido em magenta. O painel em destaque é o agente
que você está acompanhando, com o cursor de terminal ativo. A composição
comunica vários terminais vivos ao mesmo tempo e a atenção voltada para um
deles.

## Arquivos oficiais

| Arquivo | Uso |
| --- | --- |
| `logo/icon.svg` | ícone principal com placa petróleo |
| `logo/icon-light.svg` | símbolo transparente sobre fundo claro |
| `logo/icon-dark.svg` | símbolo transparente sobre fundo escuro |
| `logo/logo-light.svg` | assinatura horizontal sobre fundo claro |
| `logo/logo-dark.svg` | assinatura horizontal sobre fundo escuro |
| `logo/icon.png` | fallback raster de 512 × 512 px |
| `logo/icon-light.png`, `logo/icon-dark.png` | símbolos raster de 512 × 512 px |
| `logo/logo-light.png`, `logo/logo-dark.png` | assinaturas raster de 1300 × 484 px |
| `logo/icon-16w.png` a `logo/icon-512w.png` | favicons e ícones de aplicativo de 16, 32, 48, 180, 192 e 512 px |

O nome na assinatura está convertido em curvas, em Manrope 750. Use a
variante correspondente ao fundo. Preserve 12,5% de área livre ao redor do
ativo. O tamanho mínimo é 24 px para o ícone e 140 px para a assinatura.
Dimensões e hashes de cada arquivo ficam em `manifest.json`.

## Sistema digital

- `colors/palette.json`: fonte editável da paleta;
- `colors/README.md`: papel de cada família;
- `tokens.json`: tokens agnósticos;
- `global.css`: webfontes, variáveis CSS e troca de tema;
- `tailwind-theme.js`: extensão para Tailwind CSS;
- `accessibility.md`: relatório de contraste;
- `typography/README.md`: hierarquia tipográfica;
- `fonts/`: Manrope e Inter latinas, com as licenças OFL;
- `style-guide.html`: guia visual para abrir no navegador.

## Regras para agentes

1. Use os ativos desta pasta sem redesenhá-los.
2. Magenta indica o agente ou painel em foco; turquesa identifica a família.
3. Estado nunca depende apenas de cor: inclua texto, ícone ou posição.
4. Use tokens semânticos e a variante correta para light ou dark mode.
5. Como texto, use o acento semântico (`#A41F51` no claro, `#F6A8C4` no
   escuro), nunca o magenta 500 do símbolo.
6. Não aplique filtros, gradientes, sombras, rotações ou deformações.
