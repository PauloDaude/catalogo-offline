# Ativar seleção em lote e exclusão de produtos

A interface e o SQL foram testados no Supabase local, as migrations 006, 007 e 008 devem ser
aplicadas no projeto real para habilitar as novas ações

## Aplicar no Supabase

1. Termine as edições do catálogo, gere um backup com `npm run backup:catalog`
   e confira com `npm run backup:verify -- backups/NOME_DA_COPIA`
2. No projeto correto do Dashboard, abra **SQL Editor → New query**
3. Copie todo o arquivo
   [202610290006_product_actions.sql](../../supabase/migrations/202610290006_product_actions.sql)
   e clique em **Run**, o arquivo exige a migration 005 anterior
   Se a 006 já foi aplicada, não a repita
4. Depois, execute integralmente
   [202610290007_bulk_remove_products.sql](../../supabase/migrations/202610290007_bulk_remove_products.sql)
   para habilitar a exclusão de vários ocultos em uma transação
5. Para habilitar a opção explícita **Ocultar e excluir também os produtos visíveis**,
   execute integralmente
   [202610290008_hide_and_remove_products.sql](../../supabase/migrations/202610290008_hide_and_remove_products.sql)
   depois da 007, não repita as migrations já aplicadas
6. Confira as funções e a proteção contra DELETE direto:

```sql
select
  to_regprocedure('public.set_products_visibility(jsonb,boolean)') as lote,
  to_regprocedure('public.remove_product(uuid,bigint)') as exclusao,
  to_regprocedure('public.remove_products(jsonb)') as exclusao_em_lote,
  to_regprocedure('public.remove_products_v2(jsonb,boolean)') as ocultar_e_excluir,
  has_table_privilege('authenticated','public.products','DELETE') as delete_direto;
```

Os quatro primeiros campos devem mostrar as funções, `delete_direto` deve ser false

7. Recarregue o painel local e confira a seleção usando produtos de teste próprios

Aplicar esse SQL não exclui nem oculta produtos existentes, não importa novos
produtos e não atualiza a build publicada

## Uso no painel

- Marque produtos individualmente ou use **Selecionar página**
- A contagem inclui produtos marcados em outras páginas
- **Mostrar** e **Ocultar** abrem confirmação separando quem será alterado de quem
  já está no estado escolhido, com nomes/códigos de todas as páginas selecionadas
- Quando não há itens elegíveis, a confirmação fica desabilitada e o modal explica
- Trocar filtros, abrir edição ou trocar a aba limpa a seleção
- Depois de ocultar um produto, **Excluir** abre uma confirmação definitiva
- **Excluir selecionados** permite remover vários ocultos, produtos visíveis aparecem
  numa seção separada e ficam fora da operação por padrão
- A opção **Ocultar e excluir também os produtos visíveis** inclui esses itens na
  exclusão, exige confirmação explícita e é desmarcada ao fechar/cancelar o modal
- A ocultação e a exclusão dessa opção ocorrem na mesma transação, se a transação for rejeitada
  o produto mantém o estado anterior, sem ocultação parcial
- A lista tem rolagem interna, com filtros e ações acima e paginação abaixo

Para mostrar, todos os produtos precisam de categoria ativa e opções disponíveis
Em conflito de edição, nenhum produto do lote muda, revise os dados atualizados
e refaça a seleção, o painel não substitui versões antigas silenciosamente

## Exclusão e recuperação

A exclusão remove produto e variantes, o código não é reutilizado. As fotos ficam
no Storage nesta etapa porque podem ser compartilhadas por produtos/opções, sua
limpeza é uma tarefa separada

O registro da importação permanece marcado como excluído, repetir o importador
não recria o produto automaticamente. Não apague o journal para contornar esse
resultado, recadastrar pelo painel cria um novo produto com outro código

Carrinhos antigos pedem revisão ao atualizar a disponibilidade, cópias offline
refletem a remoção depois de sincronizar. Recuperação de uma exclusão exige revisar
uma cópia de backup, não há desfazer pelo painel

## Segurança

Alterar visibilidade usa RPC SECURITY INVOKER, validação do lote inteiro e locks
ordenados, a exclusão usa uma RPC invoker com helper privado de escopo restrito
O helper é SECURITY DEFINER para remover pai/filhos e atualizar o ledger sem
conceder DELETE genérico nas tabelas ou UPDATE genérico no ledger

O helper verifica a conta autorizada, estado oculto e versão mesmo quando chamado
diretamente, fixa search_path vazio e qualifica todos os objetos. Visitantes e
usuários autenticados sem autorização administrativa não podem executar as ações
