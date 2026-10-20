# Atualização do painel — remoção de categorias

A interface ganhou selects shadcn/React Aria, saída no header, área de foto com
arrastar e soltar, modais de categoria e confirmação para ocultar produtos.
O filtro Mostrar inicia em Todos, incluindo produtos visíveis e ocultos.

## Aplicar a nova regra no Supabase

Se as duas migrations anteriores já foram aplicadas, execute **somente**:

`supabase/migrations/202610200003_remove_category.sql`

1. Abra o projeto correto no Dashboard Supabase
2. Vá a SQL Editor → New query
3. Copie o conteúdo completo do arquivo acima e clique em Run
4. Confirme que não houve erro e recarregue o painel

Não reaplique as migrations anteriores e não conceda DELETE geral manualmente.
A nova migration adiciona a RPC e a política necessárias, com acesso restrito a
administradores autorizados e categorias arquivadas.

## Comportamento aprovado

- Criar e renomear abrem modal
- Arquivar continua reversível, com Reativar
- Remover aparece somente após arquivar e exige confirmação
- Categoria com qualquer produto vinculado, inclusive oculto, não pode ser removida
- Mova os produtos para outra categoria antes da remoção, sem exclusão em cascata
- A exclusão efetiva atualiza a revisão pública na mesma transação
- Visitantes e contas não autorizadas não podem remover categorias

A regra foi verificada no Supabase local com testes de autorização e integridade,
a aplicação remota depende de executar a migration no projeto. Nenhuma publicação online é feita automaticamente.
