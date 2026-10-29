begin;

do $$
begin
  if to_regprocedure('public.import_product_v2(text,jsonb)') is null then
    raise exception 'Aplique as migrations 001 a 005 antes desta migration';
  end if;
end;
$$;

create function public.set_products_visibility(p_items jsonb, p_active boolean)
returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  selected_count integer;
  locked_count integer := 0;
  changed_count integer;
  selected record;
begin
  if not private.is_catalog_admin() then
    raise insufficient_privilege;
  end if;
  if p_active is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Informe os produtos selecionados' using errcode = '23514';
  end if;
  selected_count := jsonb_array_length(p_items);
  if selected_count not between 1 and 1000 then
    raise exception 'Selecione de 1 a 1000 produtos' using errcode = '23514';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) item
    where nullif(item->>'id', '') is null or item->>'expected_version' is null
  ) or (select count(distinct (item->>'id')::uuid) from jsonb_array_elements(p_items) item) <> selected_count then
    raise exception 'Seleção inválida ou repetida' using errcode = '23514';
  end if;

  -- A deterministic lock order serializes edits, variant edits and deletion.
  for selected in
    select p.id, p.version, (item->>'expected_version')::bigint expected_version
    from public.products p
    join jsonb_array_elements(p_items) item on p.id = (item->>'id')::uuid
    order by p.id for update of p
  loop
    locked_count := locked_count + 1;
    if selected.version <> selected.expected_version then
      raise exception 'Um produto selecionado foi alterado' using errcode = '40001';
    end if;
  end loop;
  if locked_count <> selected_count then
    raise exception 'Um produto selecionado não existe mais' using errcode = 'P0002';
  end if;

  if p_active then
    perform c.id from public.categories c
    where c.id in (
      select p.category_id from public.products p
      join jsonb_array_elements(p_items) item on p.id = (item->>'id')::uuid
    ) order by c.id for share;
    if exists (
      select 1 from public.products p
      join jsonb_array_elements(p_items) item on p.id = (item->>'id')::uuid
      join public.categories c on c.id = p.category_id
      where not c.active or (p.has_variants and not exists (
        select 1 from public.product_variants v where v.product_id = p.id and v.active
      ))
    ) then
      raise exception 'Escolha categoria e opções ativas antes de mostrar' using errcode = '23514';
    end if;
  end if;

  update public.products p set active = p_active
  where p.active is distinct from p_active and p.id in (
    select (item->>'id')::uuid from jsonb_array_elements(p_items) item
  );
  get diagnostics changed_count = row_count;
  return jsonb_build_object('updated', changed_count);
end;
$$;
revoke all on function public.set_products_visibility(jsonb, boolean) from public, anon;
grant execute on function public.set_products_visibility(jsonb, boolean) to authenticated;

-- Keep import keys after deletion: retry must not resurrect deleted products.
alter table private.catalog_import_operations
  alter column product_id drop not null,
  add column deleted_code text,
  add column deleted_at timestamptz;
alter table private.catalog_import_operations
  drop constraint catalog_import_operations_product_id_fkey,
  add constraint catalog_import_operations_product_id_fkey
    foreign key (product_id) references public.products(id) on delete set null;

create function private.record_import_deletion()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update private.catalog_import_operations
  set deleted_code = old.code, deleted_at = clock_timestamp()
  where product_id = old.id;
  return old;
end;
$$;
revoke all on function private.record_import_deletion() from public, anon, authenticated;
create trigger record_import_deletion before delete on public.products
for each row execute function private.record_import_deletion();

-- Narrow privileged helper: avoids giving clients DELETE on catalog tables.
-- Authorization and the hidden/version conditions apply even to direct calls.
create function private.remove_product(p_id uuid, p_expected_version bigint)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  product public.products;
begin
  if not private.is_catalog_admin() then
    raise insufficient_privilege;
  end if;
  select * into product from public.products where id = p_id for update;
  if not found then
    raise exception 'Produto não encontrado' using errcode = 'P0002';
  end if;
  if product.version is distinct from p_expected_version then
    raise exception 'O produto foi alterado' using errcode = '40001';
  end if;
  if product.active then
    raise exception 'Oculte o produto antes de excluir' using errcode = '23514';
  end if;
  delete from public.product_variants where product_id = p_id;
  delete from public.products where id = p_id;
end;
$$;
revoke all on function private.remove_product(uuid, bigint) from public, anon, authenticated;
grant execute on function private.remove_product(uuid, bigint) to authenticated;

create function public.remove_product(p_id uuid, p_expected_version bigint)
returns void language sql security invoker set search_path = ''
as $$
  select private.remove_product(p_id, p_expected_version);
$$;
revoke all on function public.remove_product(uuid, bigint) from public, anon;
grant execute on function public.remove_product(uuid, bigint) to authenticated;

create trigger products_delete_revision after delete on public.products
for each statement execute function private.bump_catalog_revision();

create or replace function public.import_product_v2(p_import_key text,p_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare h text; op private.catalog_import_operations; result jsonb;
begin
 if not private.is_catalog_admin() then raise insufficient_privilege; end if;
 if p_payload->>'id' is not null then raise exception 'A importação cria um produto, não sobrescreve outro' using errcode='23514'; end if;
 h:=encode(sha256(convert_to(p_payload::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(p_import_key,0));
 select * into op from private.catalog_import_operations where import_key=p_import_key;
 if found then
  if op.product_id is null then raise exception 'Produto desta importação foi excluído' using errcode='P0002'; end if;
  if op.payload_hash<>h then raise exception 'O conteúdo da importação mudou' using errcode='40001'; end if;
  return (select to_jsonb(p)||jsonb_build_object('variants',coalesce((select jsonb_agg(to_jsonb(v)) from public.product_variants v where v.product_id=p.id),'[]'::jsonb)) from public.products p where id=op.product_id);
 end if;
 result:=public.save_product_v2(p_payload);
 insert into private.catalog_import_operations(import_key,payload_hash,product_id) values(p_import_key,h,(result->>'id')::uuid);
 return result;
end$$;

commit;
