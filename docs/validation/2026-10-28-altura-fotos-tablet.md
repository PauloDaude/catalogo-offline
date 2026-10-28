# Altura das fotos no tablet — 28/10/2026

## Ajuste

No modo Folhear catálogo, fotos em telas de 651 a 1024 px usam altura máxima de
44% do viewport, limitada a 460 px. A largura continua seguindo a proporção
original, sem recorte. Celulares estreitos, desktop, grade e detalhes preservam
seus limites anteriores.

No iPad mini de 768 × 1024 px, o limite passa de aproximadamente 655 para 451 px,
liberando espaço para a etiqueta e a navegação. Em paisagem, adapta-se à altura
menor da tela.

## Verificação

Os testes novos reproduziram excesso de altura em fotos quadradas e verticais
antes do ajuste. A matriz inclui fotos 600 × 900, 800 × 800 e 1200 × 600 em telas
360 × 900, 768 × 1024, 1024 × 768, 1280 × 900 e 844 × 390.

Além do limite de altura, verificar proporção, etiqueta dentro da tela, abertura
de detalhes, posição das setas, toque/arrasto e adição ao carrinho. Captura de foto
quadrada em iPad mini inspecionada no navegador local.

Os 22 testes de navegador relevantes passaram, incluindo 15 combinações de foto e
viewport. Build de produção, lint, Prettier dos arquivos alterados e diff check
passaram. Validação automatizada em Chromium, sem
validação em iPad físico e sem publicação online.
