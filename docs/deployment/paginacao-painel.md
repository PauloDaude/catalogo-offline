# Ativar paginação do painel

A alteração exige a migration
`supabase/migrations/202610270004_admin_pagination.sql` no mesmo projeto Supabase
usado pelo catálogo. Ela não altera os produtos, as categorias ou o snapshot público.

1. Abra o projeto no Dashboard do Supabase
2. Entre em **SQL Editor → New query**
3. Copie o conteúdo completo da migration, confira que está no projeto correto e
   execute com **Run** uma única vez
4. Abra o painel da aplicação atualizada e confira o total e a troca de páginas
5. Pesquise um produto que estava em outra página, por nome e por código
6. Combine categoria e Mostrar, teste uma edição e confirme que permanece na página

A migration cria duas funções administrativas SECURITY INVOKER, com RLS e
verificação explícita de autorização. Somente contas autorizadas acessam a consulta
paginada ou os vínculos de categorias. Também habilita a extensão unaccent para
preservar a pesquisa sem distinção de acentos, sem interpolar texto em filtros.

Se a migration ainda não foi aplicada, o painel atualizado mostrará erro de
carregamento, sem recorrer a uma lista incompleta. O catálogo público continua
usando a consulta integral existente, incluindo a preparação offline.

Aplicação e validação remotas devem ser confirmadas separadamente. Não publicar
uma build que dependa dessas funções antes de aplicar a migration no remoto.
