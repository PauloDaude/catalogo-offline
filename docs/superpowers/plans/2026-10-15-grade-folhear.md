# Folhear com grade ajustável

Execução direta autorizada pelo usuário nesta conversa. Refinamento do protótipo
existente, mantendo fotos proporcionais, faixa à esquerda, carrinho e offline.

- [x] Corrigir gesto: esquerda avança, direita volta; atualizar instrução visível
      e testes de toque e mouse para essa direção.
- [x] Separar produto visual em `CatalogBookProduct.tsx`, com proporção e botão
      de adicionar independentes por item.
- [x] Em `CatalogBook.tsx`, oferecer controle de 1 a 5 produtos por tela e filtro
      de categorias incluindo Todas. Manter Cozinha inicialmente. Paginar em grupos
      do tamanho escolhido, sem duplicar produtos na última página.
- [x] Aplicar grade responsiva: até três colunas grandes, duas intermediárias,
      uma no celular; quantidade escolhida define itens da página, não largura
      mínima de toque. Quando houver menos resultados, mostrar apenas existentes.
- [x] Testar grupos de 1–5, última página, mudança de categoria/pesquisa, adição
      direta, gestos e proporções. Build, lint e formatação; publicar mesmo Sites.

Revisão: nomes longos, foto vertical em paisagem, preço sem sobrepor botão,
arrasto não adiciona ao carrinho, filtro sem resultados e páginas incompletas.
