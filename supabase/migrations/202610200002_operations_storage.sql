create function public.save_product(p_id uuid,p_expected_version bigint,p_name text,p_category_id uuid,p_price_cents integer,p_previous_price_cents integer,p_image_path text,p_active boolean) returns public.products language plpgsql security invoker set search_path = '' as $$
declare saved public.products;
begin
 if not private.is_catalog_admin() then raise insufficient_privilege; end if;
 if p_id is null then
  insert into public.products(name,category_id,price_cents,previous_price_cents,image_path,active)
  values (btrim(p_name),p_category_id,p_price_cents,p_previous_price_cents,p_image_path,p_active) returning * into saved;
 else
  update public.products set name=btrim(p_name),category_id=p_category_id,price_cents=p_price_cents,previous_price_cents=p_previous_price_cents,image_path=p_image_path,active=p_active
  where id=p_id and version=p_expected_version returning * into saved;
  if not found then raise exception 'Este produto mudou. Recarregue os dados antes de salvar.' using errcode='40001'; end if;
 end if;
 return saved;
end;$$;
revoke all on function public.save_product(uuid,bigint,text,uuid,integer,integer,text,boolean) from public,anon;
grant execute on function public.save_product(uuid,bigint,text,uuid,integer,integer,text,boolean) to authenticated;

create function public.archive_category(p_id uuid,p_active boolean) returns void language plpgsql security invoker set search_path = '' as $$
begin
 if not private.is_catalog_admin() then raise insufficient_privilege; end if;
 update public.categories set active=p_active where id=p_id;
 if not found then raise exception 'Categoria não encontrada.' using errcode='P0002'; end if;
end;$$;
revoke all on function public.archive_category(uuid,boolean) from public,anon;
grant execute on function public.archive_category(uuid,boolean) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-photos','product-photos',true,5242880,array['image/jpeg']);
-- Public bytes are available through public URLs. Listing objects is admin-only.
create policy product_photos_read_admin on storage.objects for select to authenticated using(bucket_id='product-photos' and (select private.is_catalog_admin()));
create policy product_photos_insert on storage.objects for insert to authenticated with check(bucket_id='product-photos' and (select private.is_catalog_admin()) and name ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$');
create policy product_photos_delete on storage.objects for delete to authenticated using(bucket_id='product-photos' and (select private.is_catalog_admin()) and name ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$');
-- No UPDATE policy: replacing an existing object is intentionally denied.
