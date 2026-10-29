begin;

do $$
begin
  if to_regprocedure('private.remove_product(uuid,bigint)') is null then
    raise exception 'Aplique as migrations 001 a 006 antes desta migration';
  end if;
end;
$$;

-- Keep the existing narrow deletion helper, but validate and lock the whole batch
-- first. One RPC is one transaction, including variants and import tombstones.
create function private.remove_products(p_items jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  expected_count integer;
  locked_count integer := 0;
  selected record;
begin
  if not private.is_catalog_admin() then
    raise insufficient_privilege;
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
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
    if selected.active then
      raise exception 'Oculte todos os produtos antes de excluir' using errcode = '23514';
    end if;
  end loop;
  if locked_count <> expected_count then
    raise exception 'Um produto selecionado não existe mais' using errcode = 'P0002';
  end if;

  for selected in
    select p.id, p.version from public.products p
    join jsonb_array_elements(p_items) item on p.id = (item->>'id')::uuid
    order by p.id
  loop
    perform private.remove_product(selected.id, selected.version);
  end loop;
  return jsonb_build_object('deleted', expected_count);
end;
$$;
revoke all on function private.remove_products(jsonb) from public, anon, authenticated;
grant execute on function private.remove_products(jsonb) to authenticated;

create function public.remove_products(p_items jsonb)
returns jsonb language sql security invoker set search_path = ''
as $$
  select private.remove_products(p_items);
$$;
revoke all on function public.remove_products(jsonb) from public, anon;
grant execute on function public.remove_products(jsonb) to authenticated;

commit;
