begin;
-- Prerequisites, before any schema change.
do $$begin
 if to_regprocedure('public.list_admin_products(integer,text,uuid,text)') is null
 or to_regprocedure('public.remove_category(uuid)') is null then
  raise exception 'Aplique as migrations 001 a 004 antes desta migration';
 end if;
end$$;

alter table public.products
 add column has_variants boolean not null default false,
 add column variant_attribute text,
 add column next_variant_number integer not null default 1 check(next_variant_number>0),
 add column sale_kind text default 'unit',
 add column pack_count integer default 1,
 add column units_per_pack integer default 1;
alter table public.products alter column price_cents drop not null;
alter table public.products add constraint product_mode_valid check(
 (not has_variants and price_cents is not null and sale_kind is not null and pack_count is not null and units_per_pack is not null and sale_kind in ('unit','box') and pack_count>0 and units_per_pack>0
 and pack_count::bigint*units_per_pack<=100000 and (sale_kind='box' or (pack_count=1 and units_per_pack=1)))
 or (has_variants and price_cents is null and previous_price_cents is null and sale_kind is null and pack_count is null and units_per_pack is null
 and char_length(btrim(variant_attribute)) between 1 and 80 and variant_attribute is not null)
);
create table public.product_variants(
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
 code text not null unique, label text not null check(label=btrim(label) and char_length(label) between 1 and 80),
 price_cents integer not null check(price_cents between 0 and 999999999),
 previous_price_cents integer check(previous_price_cents between 1 and 999999999 and previous_price_cents>price_cents),
 image_path text check(image_path ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'), active boolean not null default true,
 sale_kind text not null default 'unit' check(sale_kind in ('unit','box')),
 pack_count integer not null default 1 check(pack_count>0), units_per_pack integer not null default 1 check(units_per_pack>0),
 version bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(pack_count::bigint*units_per_pack<=100000),check(sale_kind='box' or(pack_count=1 and units_per_pack=1))
);
create unique index variant_label_unique on public.product_variants(product_id,lower(label));
alter table public.product_variants enable row level security;
revoke all on public.product_variants from public,anon,authenticated;
grant select on public.product_variants to anon,authenticated;
grant insert,update on public.product_variants to authenticated;
create policy variants_read on public.product_variants for select to anon,authenticated using(
 (select private.is_catalog_admin()) or (active and exists(select 1 from public.products p join public.categories c on c.id=p.category_id where p.id=product_id and p.active and p.has_variants and c.active))
);
create policy variants_insert on public.product_variants for insert to authenticated with check((select private.is_catalog_admin()));
create policy variants_update on public.product_variants for update to authenticated using((select private.is_catalog_admin())) with check((select private.is_catalog_admin()));

create function private.guard_product_identity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if exists(select 1 from public.product_variants where id=new.id) then raise exception 'Identificação já pertence a uma opção' using errcode='23514'; end if;
 elsif new.next_variant_number<old.next_variant_number then raise exception 'Contador de códigos não pode regredir' using errcode='23514'; end if;
 return new;
end$$;
revoke all on function private.guard_product_identity() from public,anon,authenticated;
create trigger guard_product_identity before insert or update on public.products for each row execute function private.guard_product_identity();

create function private.prepare_variant() returns trigger language plpgsql security definer set search_path='' as $$
declare n integer; parent public.products;
begin
 select * into parent from public.products where id=new.product_id for update;
 if not found then raise exception 'Produto não encontrado' using errcode='23503'; end if;
 if not parent.has_variants and new.active then raise exception 'Ative o modo com variantes antes de disponibilizar opções' using errcode='23514'; end if;
 if TG_OP='INSERT' then
  if exists(select 1 from public.products where id=new.id) then raise exception 'Identificação da opção já pertence a um produto' using errcode='23514'; end if;
  if (select count(*) from public.product_variants where product_id=new.product_id)>=50 then raise exception 'Limite de 50 opções' using errcode='23514'; end if;
  n:=parent.next_variant_number;
  new.code:=parent.code||'-V'||lpad(n::text,greatest(2,length(n::text)),'0');new.version:=1;
  update public.products set next_variant_number=n+1 where id=new.product_id;
 else
  if new.id<>old.id or new.product_id<>old.product_id or new.code<>old.code then raise exception 'Identificação imutável' using errcode='23514'; end if;
  new.version:=old.version+1;
  update public.products set updated_at=clock_timestamp() where id=new.product_id;
 end if;
 new.updated_at:=clock_timestamp();return new;
end$$;
revoke all on function private.prepare_variant() from public,anon,authenticated;
create trigger prepare_variant before insert or update on public.product_variants for each row execute function private.prepare_variant();
create trigger variants_revision after insert or update on public.product_variants for each statement execute function private.bump_catalog_revision();
create function private.check_variant_mode() returns trigger language plpgsql security definer set search_path='' as $$
declare p public.products; pid uuid;
begin
 if TG_TABLE_NAME='products' then pid:=new.id; else pid:=new.product_id; end if;
 select * into p from public.products where id=pid;
 if p.has_variants and p.active and not exists(select 1 from public.product_variants v where v.product_id=pid and v.active) then
  raise exception 'Um produto visível precisa ter opção disponível' using errcode='23514';
 end if;
 return null;
end$$;
revoke all on function private.check_variant_mode() from public,anon,authenticated;
create constraint trigger product_mode_check after insert or update on public.products deferrable initially deferred for each row execute function private.check_variant_mode();
create constraint trigger variant_mode_check after insert or update on public.product_variants deferrable initially deferred for each row execute function private.check_variant_mode();

create function public.save_product_v2(p_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.products; option_row jsonb; saved public.product_variants; pid uuid; hasv boolean; changed integer; seen uuid[]:='{}';
begin
 if not private.is_catalog_admin() then raise insufficient_privilege; end if;
 hasv:=coalesce((p_payload->>'has_variants')::boolean,false);
 pid:=nullif(p_payload->>'id','')::uuid;
 if pid is not null then
  select * into p from public.products where id=pid for update;
  if not found or p.version<>coalesce((p_payload->>'expected_version')::bigint,-1) then raise exception 'Este produto foi alterado em outro lugar' using errcode='40001'; end if;
 end if;
 if hasv and (jsonb_typeof(p_payload->'variants') is distinct from 'array' or jsonb_array_length(p_payload->'variants') not between 1 and 50) then
  raise exception 'Informe de 1 a 50 opções' using errcode='23514';
 end if;
 if pid is null then
  insert into public.products(name,category_id,image_path,active,has_variants,variant_attribute,price_cents,previous_price_cents,sale_kind,pack_count,units_per_pack)
  values(btrim(p_payload->>'name'),(p_payload->>'category_id')::uuid,p_payload->>'image_path',coalesce((p_payload->>'active')::boolean,true),hasv,
  case when hasv then btrim(p_payload->>'variant_attribute') end,
  case when not hasv then (p_payload->>'price_cents')::integer end,case when not hasv then (p_payload->>'previous_price_cents')::integer end,
  case when not hasv then coalesce(p_payload->>'sale_kind','unit') end,case when not hasv then coalesce((p_payload->>'pack_count')::integer,1) end,case when not hasv then coalesce((p_payload->>'units_per_pack')::integer,1) end)
  returning * into p;pid:=p.id;
 else
  update public.products set name=btrim(p_payload->>'name'),category_id=(p_payload->>'category_id')::uuid,image_path=p_payload->>'image_path',
  active=coalesce((p_payload->>'active')::boolean,true),has_variants=hasv,variant_attribute=case when hasv then btrim(p_payload->>'variant_attribute') end,
  price_cents=case when not hasv then (p_payload->>'price_cents')::integer end,previous_price_cents=case when not hasv then (p_payload->>'previous_price_cents')::integer end,
  sale_kind=case when not hasv then coalesce(p_payload->>'sale_kind','unit') end,pack_count=case when not hasv then coalesce((p_payload->>'pack_count')::integer,1) end,units_per_pack=case when not hasv then coalesce((p_payload->>'units_per_pack')::integer,1) end
  where id=pid;
 end if;
 if hasv then
  for option_row in select value from jsonb_array_elements(p_payload->'variants') loop
   if nullif(option_row->>'id','') is null then
    insert into public.product_variants(product_id,label,price_cents,previous_price_cents,image_path,active,sale_kind,pack_count,units_per_pack)
    values(pid,btrim(option_row->>'label'),(option_row->>'price_cents')::integer,(option_row->>'previous_price_cents')::integer,nullif(option_row->>'image_path',''),coalesce((option_row->>'active')::boolean,true),coalesce(option_row->>'sale_kind','unit'),coalesce((option_row->>'pack_count')::integer,1),coalesce((option_row->>'units_per_pack')::integer,1)) returning * into saved;
   else
    if (option_row->>'id')::uuid=any(seen) then raise exception 'Opção duplicada' using errcode='23514'; end if;
    update public.product_variants set label=btrim(option_row->>'label'),price_cents=(option_row->>'price_cents')::integer,previous_price_cents=(option_row->>'previous_price_cents')::integer,
    image_path=nullif(option_row->>'image_path',''),active=coalesce((option_row->>'active')::boolean,true),sale_kind=coalesce(option_row->>'sale_kind','unit'),pack_count=coalesce((option_row->>'pack_count')::integer,1),units_per_pack=coalesce((option_row->>'units_per_pack')::integer,1)
    where id=(option_row->>'id')::uuid and product_id=pid and version=coalesce((option_row->>'version')::bigint,-1) returning * into saved;
    if not found then raise exception 'Opção alterada ou não pertence ao produto' using errcode='40001'; end if;
   end if;
   seen:=array_append(seen,saved.id);
  end loop;
  -- Existing options must be explicitly retained or hidden, never silently dropped.
  if exists(select 1 from public.product_variants where product_id=pid and not(id=any(seen))) then raise exception 'Inclua as opções existentes no formulário' using errcode='23514'; end if;
 else
  update public.product_variants set active=false where product_id=pid and active;
 end if;
 return (select to_jsonb(x)||jsonb_build_object('variants',coalesce((select jsonb_agg(to_jsonb(v) order by v.created_at,v.code) from public.product_variants v where v.product_id=pid),'[]'::jsonb)) from public.products x where x.id=pid);
end$$;
revoke all on function public.save_product_v2(jsonb) from public,anon;
grant execute on function public.save_product_v2(jsonb) to authenticated;

create function public.list_admin_products_v2(p_page integer default 1,p_query text default '',p_category uuid default null,p_visibility text default 'all') returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if not private.is_catalog_admin() then raise insufficient_privilege; end if;
 if p_page is null or p_page<1 or p_visibility is null or p_visibility not in('all','active','hidden') then raise invalid_parameter_value; end if;
 with filtered as materialized (
 select p.* from public.products p where(p_category is null or p.category_id=p_category) and(p_visibility='all' or p.active=(p_visibility='active'))
 and (strpos(lower(extensions.unaccent(p.name||' '||p.code)),lower(extensions.unaccent(coalesce(p_query,''))))>0
 or exists(select 1 from public.product_variants v where v.product_id=p.id and strpos(lower(extensions.unaccent(v.label||' '||v.code)),lower(extensions.unaccent(coalesce(p_query,''))))>0))
 ), page as(select * from filtered order by created_at desc,id desc limit 20 offset((p_page::bigint-1)*20))
 select jsonb_build_object('total',(select count(*) from filtered),'products',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('variants',coalesce((select jsonb_agg(to_jsonb(v) order by v.created_at,v.code) from public.product_variants v where v.product_id=p.id),'[]'::jsonb)) order by p.created_at desc,p.id desc) from page p),'[]'::jsonb)) into result;
 return result;
end$$;
revoke all on function public.list_admin_products_v2(integer,text,uuid,text) from public,anon;
grant execute on function public.list_admin_products_v2(integer,text,uuid,text) to authenticated;

create function public.read_catalog_snapshot_v2() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('schemaVersion',2,'revision',s.revision,'updatedAt',s.updated_at,'products',coalesce((
 select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',p.id,'code',p.code,'name',p.name,'category',c.name,'imagePath',p.image_path,
 'hasVariants',p.has_variants,'variantAttribute',p.variant_attribute,'priceCents',p.price_cents,'previousPriceCents',p.previous_price_cents,
 'sale',case when not p.has_variants then jsonb_build_object('kind',p.sale_kind,'packCount',p.pack_count,'unitsPerPack',p.units_per_pack) end,
 'variants',case when p.has_variants then(select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',v.id,'code',v.code,'label',v.label,'priceCents',v.price_cents,'previousPriceCents',v.previous_price_cents,'imagePath',v.image_path,'sale',jsonb_build_object('kind',v.sale_kind,'packCount',v.pack_count,'unitsPerPack',v.units_per_pack))) order by v.created_at,v.code) from public.product_variants v where v.product_id=p.id and v.active) end
 )) order by p.created_at,p.code) from public.products p join public.categories c on c.id=p.category_id where p.active and c.active
 ),'[]'::jsonb)) from public.catalog_state s where s.id;
$$;
revoke all on function public.read_catalog_snapshot_v2() from public;
grant execute on function public.read_catalog_snapshot_v2() to anon,authenticated;

-- Legacy clients cannot purchase a box/variant as an ordinary unit.
create or replace function public.read_catalog_snapshot() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('revision',s.revision,'updatedAt',s.updated_at,'products',coalesce((
 select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',p.id,'code',p.code,'name',p.name,'category',c.name,'priceCents',p.price_cents,'previousPriceCents',p.previous_price_cents,'imagePath',p.image_path)) order by p.created_at,p.code)
 from public.products p join public.categories c on c.id=p.category_id where p.active and c.active and not p.has_variants and p.sale_kind='unit'
 ),'[]'::jsonb)) from public.catalog_state s where s.id;
$$;
create or replace function public.list_admin_products(p_page integer default 1,p_query text default '',p_category uuid default null,p_visibility text default 'all') returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if not private.is_catalog_admin() then raise insufficient_privilege; end if;
 if p_page is null or p_page<1 or p_visibility is null or p_visibility not in('all','active','hidden') then raise invalid_parameter_value; end if;
 with filtered as materialized(select p.* from public.products p where not p.has_variants and p.sale_kind='unit' and(p_category is null or p.category_id=p_category) and(p_visibility='all' or p.active=(p_visibility='active')) and strpos(lower(extensions.unaccent(p.name||' '||p.code)),lower(extensions.unaccent(coalesce(p_query,''))))>0),page as(select * from filtered order by created_at desc,id desc limit 20 offset((p_page::bigint-1)*20))
 select jsonb_build_object('total',(select count(*) from filtered),'products',coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at desc,p.id desc) from page p),'[]'::jsonb)) into result;
 return result;
end$$;
create or replace function public.save_product(p_id uuid,p_expected_version bigint,p_name text,p_category_id uuid,p_price_cents integer,p_previous_price_cents integer,p_image_path text,p_active boolean) returns public.products language plpgsql security invoker set search_path='' as $$
declare saved public.products;
begin
 if not private.is_catalog_admin() then raise insufficient_privilege; end if;
 if p_id is not null and exists(select 1 from public.products where id=p_id and(has_variants or sale_kind<>'unit')) then raise exception 'Atualize o painel para editar opções ou caixas' using errcode='23514'; end if;
 if p_id is null then insert into public.products(name,category_id,price_cents,previous_price_cents,image_path,active) values(btrim(p_name),p_category_id,p_price_cents,p_previous_price_cents,p_image_path,p_active) returning * into saved;
 else update public.products set name=btrim(p_name),category_id=p_category_id,price_cents=p_price_cents,previous_price_cents=p_previous_price_cents,image_path=p_image_path,active=p_active where id=p_id and version=p_expected_version returning * into saved;
 if not found then raise exception 'Este produto foi alterado em outro lugar' using errcode='40001'; end if;end if;return saved;
end$$;

create table private.catalog_import_operations(import_key text primary key check(char_length(import_key) between 1 and 200),payload_hash text not null,product_id uuid not null references public.products(id),created_at timestamptz not null default now());
alter table private.catalog_import_operations enable row level security;
revoke all on private.catalog_import_operations from public,anon,authenticated;
grant select,insert on private.catalog_import_operations to authenticated;
create policy import_admin on private.catalog_import_operations to authenticated using((select private.is_catalog_admin())) with check((select private.is_catalog_admin()));
create function public.import_product_v2(p_import_key text,p_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare h text; op private.catalog_import_operations; result jsonb;
begin
 if not private.is_catalog_admin() then raise insufficient_privilege; end if;
 if p_payload->>'id' is not null then raise exception 'A importação cria um produto, não sobrescreve outro' using errcode='23514'; end if;
 h:=encode(sha256(convert_to(p_payload::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(p_import_key,0));
 select * into op from private.catalog_import_operations where import_key=p_import_key;
 if found then
  if op.payload_hash<>h then raise exception 'O conteúdo da importação mudou' using errcode='40001'; end if;
  return (select to_jsonb(p)||jsonb_build_object('variants',coalesce((select jsonb_agg(to_jsonb(v)) from public.product_variants v where v.product_id=p.id),'[]'::jsonb)) from public.products p where id=op.product_id);
 end if;
 result:=public.save_product_v2(p_payload);
 insert into private.catalog_import_operations(import_key,payload_hash,product_id) values(p_import_key,h,(result->>'id')::uuid);
 return result;
end$$;
revoke all on function public.import_product_v2(text,jsonb) from public,anon;
grant execute on function public.import_product_v2(text,jsonb) to authenticated;
update public.catalog_state set revision=revision+1,updated_at=clock_timestamp() where id;
commit;
