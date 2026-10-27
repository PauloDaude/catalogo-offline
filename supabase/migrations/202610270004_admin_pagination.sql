-- Administrative queries remain invokers: both authorization and RLS apply.
create extension if not exists unaccent with schema extensions;

create function public.list_admin_products(
 p_page integer default 1,
 p_query text default '',
 p_category uuid default null,
 p_visibility text default 'all'
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
 if not private.is_catalog_admin() then
  raise exception 'Acesso administrativo necessário' using errcode = '42501';
 end if;
 if p_page is null or p_page < 1 or p_visibility is null or p_visibility not in ('all','active','hidden') then
  raise exception 'Consulta inválida' using errcode = '22023';
 end if;
 with filtered as materialized (
  select p.* from public.products p
  where (p_category is null or p.category_id = p_category)
   and (p_visibility = 'all' or p.active = (p_visibility = 'active'))
   and strpos(lower(extensions.unaccent(p.name || ' ' || p.code)),
              lower(extensions.unaccent(coalesce(p_query,'')))) > 0
 ), page as (
  select * from filtered order by created_at desc, id desc
  limit 20 offset ((p_page::bigint - 1) * 20)
 )
 select jsonb_build_object(
  'products', coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at desc,p.id desc) from page p), '[]'::jsonb),
  'total', (select count(*) from filtered)
 ) into result;
 return result;
end;$$;
revoke all on function public.list_admin_products(integer,text,uuid,text) from public,anon;
grant execute on function public.list_admin_products(integer,text,uuid,text) to authenticated;

-- JSON aggregate avoids PostgREST row truncation when checking category links.
create function public.list_admin_category_products(p_category uuid,p_active_only boolean default false)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
 if not private.is_catalog_admin() then
  raise exception 'Acesso administrativo necessário' using errcode = '42501';
 end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'active',p.active) order by p.name,p.id),'[]'::jsonb)
 from public.products p where p.category_id = p_category and (not p_active_only or p.active));
end;$$;
revoke all on function public.list_admin_category_products(uuid,boolean) from public,anon;
grant execute on function public.list_admin_category_products(uuid,boolean) to authenticated;
