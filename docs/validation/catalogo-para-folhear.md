# Demonstração de catálogo para folhear — 15/10/2026

Desenho aprovado em conversa: validar uma categoria em páginas de catálogo antes
de alterar toda a apresentação. Categoria escolhida: Cozinha, com três produtos
fictícios já existentes. Nenhum novo produto ou conteúdo do PDF foi importado.

## Comportamento

- Link direto `?visualizacao=folhear`, também acessível pelo botão Folhear catálogo.
- Fotos inteiras, código, nome e preço; indicação de oferta discreta.
- Dois produtos por página acima de 650 px; um abaixo ou em 650 px.
- Navegação Anterior/Próxima com controles de 48 px e contador de página.
- Pesquisa em Cozinha reinicia na primeira página. Ausência de resultados tem
  orientação e botão de limpar. Resize mantém uma página válida e o produto âncora.
- Um índice explícito para a categoria demonstrada; demais categorias preservadas
  no visual anterior, sem ações fictícias ou categorias vazias na prévia.
- Detalhes e adição reutilizam o fluxo atual. A seleção persiste entre os visuais.
- Dados/fotos são os do catálogo existente e reabrem offline após preparação.
- SyncStatus e atualização do aplicativo continuam acessíveis abaixo da página.
- Sem dependências adicionais, geração de PDF ou efeito de folha dobrando.

## Verificações

- 77 testes unitários/componentes passaram, incluindo paginação, pesquisa,
  entrada por link direto e seleção entre visuais.
- 28 testes de navegador passaram: regressões do catálogo anterior e seis novos
  casos de páginas em 1280×800, 800×1280, 360×800 e 640×360, navegação em todos os
  produtos de Cozinha, fotos sem corte, resize, busca e reabertura offline com
  detalhes, seleção e miniatura.
- Build, lint, formatação e `git diff --check` aprovados.
- Capturas em desktop e celular inspecionadas.
- Revisão independente sem achados concretos; revisor executou os dois testes
  unitários focados e conferiu diff. Navegador do revisor bloqueado pelo sandbox;
  testes de navegador executados pelo agente principal.

Validação com o pai do usuário e em dispositivos Android reais permanece pendente.
As fotos ilustrativas atuais mostram ambientes; fotos reais de cada mercadoria,
preferencialmente sobre fundo claro, ainda serão necessárias para uso comercial.

Uma execução intermediária teve erros `ENOENT` ao fechar os arquivos de trace dos
casos "páginas reabrem offline e compartilham seleção com visual anterior" e
"carrinho agrupa, altera quantidades e confirma limpeza". A execução final usou
`npm run test:e2e -- --output=/tmp/catalog-book-verified-results`, em diretório
isolado, e os 28 casos passaram sem esses erros.
