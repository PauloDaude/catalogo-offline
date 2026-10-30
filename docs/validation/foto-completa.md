# Foto completa e ações do modal — 30/10/2026

## Alteração

A combinação de largura total do contêiner Adicionar com flex na linha das ações
comprimia Fechar no celular. A linha passa a grid com duas colunas no mobile e
paisagem, fechamento de pelo menos 96 × 48 px. Em desktop continua em coluna.

O contêiner da foto de produtos com variantes tinha limite menor que a própria
imagem e overflow hidden, cortando-a. O limite passa para a imagem, com contain.

Ampliar foto abre um segundo diálogo React Aria ocupando o viewport, com nome,
Fechar acessível e foto inteira com contain. Fechar ou Escape volta aos detalhes,
sem adicionar produto, perder a opção escolhida ou sair do catálogo. Usa a URL
existente da imagem/Blob, preservando a consulta offline após preparação.

## Verificação

- Dez testes unitários dos detalhes, ofertas e carrossel aprovados, incluindo
  abertura/fechamento da ampliação, Escape/foco, imagem ausente e foto da variante
- Testes de navegador com a foto real da lanterna em 360×800, 390×844, 800×360 e
  1280×800, verificando botões, enquadramento, ausência de recorte, viewport e foco
- TypeScript, build demo de teste, lint e formatação conferidos
- Validação em hardware Android permanece pendente

O build demo é apenas para testes locais e não altera variáveis do Cloudflare.

## Refinamentos solicitados em seguida

A ampliação passa a usar overlay preto a 78% com blur de 8 px, título junto à
imagem e nenhum botão Fechar visível nessa camada. Clicar no fundo fecha somente
a ampliação, clicar na imagem não fecha, Escape e foco seguem funcionando.

Zoom limitado a 100–400%, pinça com dois dedos, botões +/- e restauração a 100%,
com arrasto limitado pelas bordas. Foto e controles reutilizam URLs da sessão.
Quatro cenários de navegador nos mesmos viewports aprovados, incluindo clique
fora/dentro, distância do título, zoom, arrasto e gesto de pinça via eventos touch
no Chromium. Hardware real continua pendente. Testes unitários incluem limites
mínimo/máximo e restauração do zoom.
