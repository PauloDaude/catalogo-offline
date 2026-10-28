export type AdminCategory = { id: string; name: string; active: boolean };
export type AdminProduct = {
  id: string;
  code: string;
  name: string;
  category_id: string;
  price_cents: number | null;
  previous_price_cents: number | null;
  image_path: string;
  active: boolean;
  version: number;
  has_variants?: boolean;
  variant_attribute?: string | null;
  sale_kind?: "unit" | "box" | null;
  pack_count?: number | null;
  units_per_pack?: number | null;
  variants?: AdminVariant[];
};
export type ProductValues = Omit<AdminProduct, "id" | "code" | "version">;

export type ProductQuery = {
  page: number;
  query: string;
  category: string;
  visibility: string;
};
export type CategoryProduct = Pick<AdminProduct, "id" | "name" | "active">;

export type AdminVariant = {
  id?: string;
  code?: string;
  version?: number;
  label: string;
  price_cents: number;
  previous_price_cents: number | null;
  image_path: string | null;
  active: boolean;
  sale_kind?: "unit" | "box";
  pack_count?: number;
  units_per_pack?: number;
  photo?: Blob;
};
