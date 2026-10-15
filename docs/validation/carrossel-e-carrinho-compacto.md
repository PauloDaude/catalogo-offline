# Ajustes após avaliação visual — 15/10/2026

Pedidos implementados:

- Carrinho compacto no celular: controles de quantidade junto ao item, miniatura,
  lixeira de ícone ao lado do nome, com rótulo acessível. Sem botão textual Remover.
- Hero removido, com header preservado e catálogo apresentado diretamente.
- Prévia de Cozinha em carrossel, um produto por vez e imagem grande de fundo.
- Informações sobre a imagem em painel legível; preço azul, selo de oferta azul e
  desconto verde/branco reutilizam ProductPrice e os tokens da listagem.
- Carrinho flutuante azul nos dois visuais. Controles de navegação centralizados
  para reduzir sobreposição com o botão flutuante.
- Arrastar à direita avança conforme pedido; esquerda retorna. Botões alternativos,
  limites, pesquisa, toque para detalhes e seleção mantidos.

## Verificação

- `npm test`: 77 testes de lógica e componentes passaram.
- `npm run test:e2e -- --output=/tmp/catalog-carousel-verified-results`: 32 testes
  passaram, incluindo os quatro novos casos em interaction-feedback.spec.ts.
- Casos novos: layout do carrinho em 320, 360 e 800 px; lixeira sem texto visível;
  remoção funcional; ausência de Hero; foto grande e informações sobrepostas;
  cores de preço/oferta/carrinho; gesto de toque real via CDP nos dois sentidos;
  arrasto com mouse, limites e gesto curto sem abrir detalhes.
- Regressões: offline, fotos, pesquisa, códigos, sincronização e carrinho.
- Build, lint, Prettier e `git diff --check` aprovados.
- Capturas de celular e desktop inspecionadas. Revisão independente estática sem
  achados; o revisor não executou E2E para evitar disputa de arquivos de teste.

O primeiro teste de toque falhou porque o botão React Aria consumia os eventos
antes dos handlers de gesto na fase de propagação. Handlers na fase capture
corrigiram a interação; o teste de toque falhou antes e passou depois da correção.

O fundo usa cover e pode recortar a foto; detalhes mantêm a imagem inteira.
Prévia segue limitada a Cozinha. Validação no tablet Samsung/celular reais e com
o vendedor continua pendente. Fotos e preços atuais são fictícios.

## Link público

Versão 3 do Sites confirmada como `succeeded`. Acesso anônimo HTTP 200 em 360×800:
arrasto real de toque para o segundo produto sem abrir modal, toque para detalhes,
adição de Utensílios de cozinha, carrinho azul, total R$ 25,00 e lixeira sem texto
visível verificados. Na primeira tentativa, a espera curta de 5 segundos terminou
com os produtos ainda carregando; ao aguardar o carregamento, a conferência passou.
