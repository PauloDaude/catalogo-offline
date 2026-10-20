# Refinamentos do painel — 20/10/2026

Implementados os selects shadcn com React Aria, saída no header, área de upload
com arrastar e soltar e prévia, modais de categorias, confirmação de ocultação,
erro de login destacado em vermelho e filtro Mostrar iniciado em Todos.

## Verificação local

- 102 testes unitários passaram, incluindo seleção por teclado, alerta de login,
  confirmação de ocultação e retorno para Todas após remover a categoria filtrada
- 10 testes administrativos no navegador passaram, em larguras de 320 a 1280 px,
  incluindo paisagem com pouca altura, upload, troca e remoção da prévia,
  modais, conflitos de edição, autenticação e consulta pública offline
- 54 testes do catálogo público passaram, incluindo carrossel, filtros, carrinho
  e persistência offline em uma build de demonstração isolada
- 28 testes SQL passaram no Supabase local, incluindo acesso negado a visitantes
  e usuários comuns, restrição a categorias arquivadas e preservação de produtos
  ocultos vinculados
- Build de produção com fonte Supabase, lint, formatação dos arquivos alterados
  e verificação de whitespace passaram
- Revisão do código concluída, ajustes de teclado e filtro incorporados

O teste de arrastar usa arquivos sintéticos com metadados de entrada equivalentes
aos de um arrasto nativo, sem alterar o código de produção para acomodar o teste.
Uma execução concorrente apresentou timeout em teste de carrinho, a suíte
unitária completa foi repetida isoladamente e passou sem alteração de timeout.

## Pendências externas

- Aplicar a migration `202610200003_remove_category.sql` no projeto remoto,
  conforme `docs/deployment/categorias-remocao.md`
- Validar toque, galeria/câmera, teclado e modo avião em tablet/celular reais
- Não houve publicação online nem alteração do banco remoto nesta etapa
