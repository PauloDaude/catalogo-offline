-- Authorization is provisioned only by a database administrator, never by a client.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
create table public.catalog_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.catalog_admins enable row level security;
revoke all on public.catalog_admins from anon, authenticated;

create function private.is_catalog_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.catalog_admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_catalog_admin() from public;
grant execute on function private.is_catalog_admin() to anon, authenticated;
create function public.is_catalog_admin() returns boolean language sql stable security invoker set search_path = '' as $$select private.is_catalog_admin();$$;
revoke all on function public.is_catalog_admin() from public, anon;
grant execute on function public.is_catalog_admin() to authenticated;

create table public.categories (
 id uuid primary key default gen_random_uuid(),
 name text not null check(name=btrim(name) and char_length(name) between 1 and 80),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index categories_name_unique on public.categories(lower(name));
create sequence private.product_code_seq;
create table public.products (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 name text not null check(name=btrim(name) and char_length(name) between 1 and 160),
 category_id uuid not null references public.categories(id),
 price_cents integer not null check(price_cents between 0 and 999999999),
 previous_price_cents integer check(previous_price_cents between 1 and 999999999 and previous_price_cents>price_cents),
 image_path text not null check(image_path ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'),
 active boolean not null default true,
 version bigint not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create table public.catalog_state (
 id boolean primary key default true check(id),
 revision bigint not null default 0 check(revision>=0),
 updated_at timestamptz not null default now()
);
insert into public.catalog_state(id) values (true);
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.catalog_state enable row level security;
revoke all on public.categories,public.products,public.catalog_state from anon,authenticated;
grant select on public.categories,public.products,public.catalog_state to anon,authenticated;
grant insert,update on public.categories,public.products to authenticated;
create policy categories_read on public.categories for select to anon,authenticated using(active or (select private.is_catalog_admin()));
create policy categories_insert on public.categories for insert to authenticated with check((select private.is_catalog_admin()));
create policy categories_update on public.categories for update to authenticated using((select private.is_catalog_admin())) with check((select private.is_catalog_admin()));
create policy products_read on public.products for select to anon,authenticated using((active and exists(select 1 from public.categories c where c.id=category_id and c.active)) or (select private.is_catalog_admin()));
create policy products_insert on public.products for insert to authenticated with check((select private.is_catalog_admin()));
create policy products_update on public.products for update to authenticated using((select private.is_catalog_admin())) with check((select private.is_catalog_admin()));
create policy state_read on public.catalog_state for select to anon,authenticated using(true);

-- Private definer triggers alone assign codes/revisions; clients cannot call them.
create function private.prepare_product() returns trigger language plpgsql security definer set search_path = '' as $$
declare n bigint;
begin
 if TG_OP='INSERT' then
  n:=nextval('private.product_code_seq');
  new.code:='P'||lpad(n::text,greatest(3,length(n::text)),'0');
  new.version:=1;
 else
  if new.id<>old.id or new.code<>old.code then raise exception 'O código não pode ser alterado.' using errcode='23514'; end if;
  new.version:=old.version+1;
 end if;
 -- Lock the category until commit. Category archiving locks the same row.
 if new.active then
  perform 1 from public.categories where id=new.category_id and active for share;
  if not found then raise exception 'Escolha uma categoria ativa.' using errcode='23514'; end if;
 end if;
 new.updated_at:=clock_timestamp();
 return new;
end;$$;
create trigger prepare_product before insert or update on public.products for each row execute function private.prepare_product();
create function private.prepare_category() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if not new.active and exists(select 1 from public.products where category_id=old.id and active) then
  raise exception 'Mova ou oculte os produtos antes de arquivar a categoria.' using errcode='23514';
 end if;
 new.updated_at:=clock_timestamp();return new;
end;$$;
create trigger prepare_category before update on public.categories for each row execute function private.prepare_category();
create function private.bump_catalog_revision() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 update public.catalog_state set revision=revision+1,updated_at=clock_timestamp() where id;
 return null;
end;$$;
create trigger products_revision after insert or update on public.products for each statement execute function private.bump_catalog_revision();
create trigger categories_revision after insert or update on public.categories for each statement execute function private.bump_catalog_revision();
revoke all on function private.prepare_product(),private.prepare_category(),private.bump_catalog_revision() from public,anon,authenticated;

create function public.read_catalog_snapshot() returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object('revision',s.revision,'updatedAt',s.updated_at,'products',coalesce((
 select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',p.id,'code',p.code,'name',p.name,'category',c.name,'priceCents',p.price_cents,'previousPriceCents',p.previous_price_cents,'imagePath',p.image_path)) order by p.created_at,p.code)
 from public.products p join public.categories c on c.id=p.category_id where p.active and c.active
 ),'[]'::jsonb)) from public.catalog_state s where s.id;
$$;
revoke all on function public.read_catalog_snapshot() from public;
grant execute on function public.read_catalog_snapshot() to anon,authenticated;
insert into public.categories(name) values ('Cozinha'),('Pesca'),('Iluminação'),('Ferramentas'),('Outros');
