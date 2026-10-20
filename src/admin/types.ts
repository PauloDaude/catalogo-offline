export type AdminCategory = { id: string; name: string; active: boolean };
export type AdminProduct = {
  id: string;
  code: string;
  name: string;
  category_id: string;
  price_cents: number;
  previous_price_cents: number | null;
  image_path: string;
  active: boolean;
  version: number;
};
export type ProductValues = Omit<AdminProduct, "id" | "code" | "version">;
