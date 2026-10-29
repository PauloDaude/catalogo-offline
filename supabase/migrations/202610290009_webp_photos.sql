begin;

do $$
begin
  if to_regclass('public.product_variants') is null or not exists (
    select 1 from storage.buckets where id = 'product-photos'
  ) then
    raise exception 'Aplique as migrations anteriores e confira o bucket do catálogo';
  end if;
end;
$$;

-- JPEG paths already saved in products, backups and offline copies remain valid.
alter table public.products drop constraint products_image_path_check;
alter table public.products add constraint products_image_path_check
  check (image_path ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$');
alter table public.product_variants drop constraint product_variants_image_path_check;
alter table public.product_variants add constraint product_variants_image_path_check
  check (image_path ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$');

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/webp']
where id = 'product-photos';

alter policy product_photos_insert on storage.objects to authenticated
with check (
  bucket_id = 'product-photos'
  and (select private.is_catalog_admin())
  and name ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
);
alter policy product_photos_delete on storage.objects to authenticated
using (
  bucket_id = 'product-photos'
  and (select private.is_catalog_admin())
  and name ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
);
-- Existing SELECT policy, absence of UPDATE, size cap and grants stay unchanged.
commit;
