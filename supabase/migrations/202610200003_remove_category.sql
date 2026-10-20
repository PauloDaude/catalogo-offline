-- Categories may be removed only after archiving and moving every linked product.
-- The existing FK is restrictive: hidden products are never silently deleted.
grant delete on public.categories to authenticated;

create policy categories_delete on public.categories
for delete to authenticated
using ((select private.is_catalog_admin()) and not active);

create function public.remove_category(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  category_active boolean;
begin
  if not private.is_catalog_admin() then
    raise insufficient_privilege;
  end if;

  select active into category_active
  from public.categories
  where id = p_id
  for update;

  if not found then
    raise exception 'Categoria não encontrada' using errcode = 'P0002';
  end if;

  if category_active then
    raise exception 'Arquive a categoria antes de remover' using errcode = '23514';
  end if;

  if exists (select 1 from public.products where category_id = p_id) then
    raise exception 'Mova os produtos vinculados antes de remover' using errcode = '23503';
  end if;

  delete from public.categories where id = p_id;
end;
$$;

revoke all on function public.remove_category(uuid) from public, anon;
grant execute on function public.remove_category(uuid) to authenticated;

create trigger categories_delete_revision
  after delete on public.categories
  for each row execute function private.bump_catalog_revision();
