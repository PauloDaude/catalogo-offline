begin;

do $$
begin
  if to_regprocedure('private.remove_products(jsonb)') is null then
    raise exception 'Aplique as migrations 001 a 007 antes desta migration';
  end if;
end;
$$;

-- Explicit opt-in, with hiding and deletion in the same transaction.
-- Existing hidden-only RPCs keep their behavior for older clients.
create function private.remove_products_v2(p_items jsonb, p_hide_visible boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  expected_count integer;
  hidden_count integer := 0;
  locked_count integer := 0;
  selected record;
begin
  if not private.is_catalog_admin() then
    raise insufficient_privilege;
  end if;
  if p_hide_visible is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Informe os produtos selecionados' using errcode = '23514';
  end if;
  expected_count := jsonb_array_length(p_items);
  if expected_count not between 1 and 1000 then
    raise exception 'Selecione de 1 a 1000 produtos' using errcode = '23514';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) item
    where nullif(item->>'id', '') is null or item->>'expected_version' is null
  ) or (select count(distinct (item->>'id')::uuid) from jsonb_array_elements(p_items) item) <> expected_count then
    raise exception 'Seleção inválida ou repetida' using errcode = '23514';
  end if;

  for selected in
    select p.id, p.version, p.active, (item->>'expected_version')::bigint expected_version
    from public.products p
    join jsonb_array_elements(p_items) item on p.id = (item->>'id')::uuid
    order by p.id for update of p
  loop
    locked_count := locked_count + 1;
    if selected.version <> selected.expected_version then
      raise exception 'Um produto selecionado foi alterado' using errcode = '40001';
    end if;
    if selected.active and not p_hide_visible then
      raise exception 'Oculte todos os produtos antes de excluir' using errcode = '23514';
    end if;
  end loop;
  if locked_count <> expected_count then
    raise exception 'Um produto selecionado não existe mais' using errcode = 'P0002';
  end if;

  if p_hide_visible then
    update public.products p set active = false
    where p.active and p.id in (
      select (item->>'id')::uuid from jsonb_array_elements(p_items) item
    );
    get diagnostics hidden_count = row_count;
  end if;

  -- Use versions produced by this transaction after hiding, never client versions.
  for selected in
    select p.id, p.version from public.products p
    join jsonb_array_elements(p_items) item on p.id = (item->>'id')::uuid
    order by p.id
  loop
    perform private.remove_product(selected.id, selected.version);
  end loop;
  return jsonb_build_object('deleted', expected_count, 'hidden', hidden_count);
end;
$$;
revoke all on function private.remove_products_v2(jsonb, boolean) from public, anon, authenticated;
grant execute on function private.remove_products_v2(jsonb, boolean) to authenticated;

create function public.remove_products_v2(p_items jsonb, p_hide_visible boolean default false)
returns jsonb language sql security invoker set search_path = ''
as $$
  select private.remove_products_v2(p_items, p_hide_visible);
$$;
revoke all on function public.remove_products_v2(jsonb, boolean) from public, anon;
grant execute on function public.remove_products_v2(jsonb, boolean) to authenticated;

commit;
