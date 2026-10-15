# Fotos proporcionais e faixa lateral — 15/10/2026

Pedido do usuário: preservar fotos verticais e quadradas no modo de folhear e
experimentar uma etiqueta de nome/preço saindo da lateral, como na referência.

## Implementação

- Foto usa a proporção natural medida após decodificação, sem recorte. A largura
  acompanha essa proporção e a altura máxima acompanha o viewport.
- Faixa branca com detalhe azul sobrepõe a borda inferior e se projeta à esquerda;
  participa do fluxo para acomodar texto e ofertas sem cortar conteúdo.
- Área de abertura dos detalhes inclui a extensão lateral. Mantidos código,
  categoria, preços azuis, ofertas, carrinho e gestos de navegação.
- Não altera o visual da listagem nem os dados, downloads ou snapshots offline.

## Evidências

- Teste com JPEG vertical 600×900 falhou antes da mudança por proporção incorreta.
- Seis casos com JPEGs verticais, quadrados e horizontais, em larguras 360 e 1280,
  verificam proporção exibida, faixa sobreposta e projetada à esquerda, ausência de
  overflow horizontal e abertura de detalhes ao clicar na extensão lateral.
- Capturas com a foto ilustrativa de Garrafa térmica inspecionadas em 360×800 e
  1280×900. Foto inteira visível; faixa e navegação sem cortes.
- Verificação completa: 77 testes unitários/componentes e 38 testes E2E, incluindo
  gestos de toque/mouse, seleção compartilhada e reabertura offline.
- Build, lint e formatação verificados. Avaliação com o vendedor e aparelhos
  Android reais continua pendente.

## Acabamento da dobra

Após revisão visual do usuário, a dobra foi movida para trás da foto, com
contorno curvo e gradiente azul discreto. Capturas desktop/celular inspecionadas;
os dez testes de proporção, extensão clicável e gestos passaram novamente.
