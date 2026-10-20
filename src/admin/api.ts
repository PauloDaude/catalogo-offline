import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminCategory, AdminProduct, ProductValues } from "./types";

export class AdminError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function explainError(error: unknown): string {
  if (error instanceof AdminError) return error.message;
  return "Não foi possível salvar, confira sua conexão e tente novamente";
}

function check(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "40001")
    throw new AdminError(
      "conflict",
      "Este produto foi alterado em outro lugar\nSuas alterações continuam aqui, recarregue os dados para comparar antes de salvar",
    );
  if (error.code === "23503")
    throw new AdminError(
      "linked",
      "Esta categoria ainda tem produtos vinculados, mova-os antes de remover",
    );
  if (error.code === "23505")
    throw new AdminError("duplicate", "Já existe uma categoria com esse nome.");
  if (error.code === "23514")
    throw new AdminError(
      "invalid",
      "A oferta precisa de preço anterior maior e produtos visíveis precisam de categoria ativa\nPara arquivar, mova ou oculte os produtos da categoria",
    );
  if (error.code === "42501")
    throw new AdminError(
      "denied",
      "Sua conta não tem permissão para esta ação.",
    );
  throw new AdminError(
    "network",
    "Não foi possível salvar, confira sua conexão e tente novamente",
  );
}

export function createAdminApi(client: SupabaseClient) {
  return {
    async list() {
      const [products, categories] = await Promise.all([
        client
          .from("products")
          .select("*")
          .order("created_at", { ascending: false }),
        client.from("categories").select("id,name,active").order("name"),
      ]);
      check(products.error);
      check(categories.error);
      return {
        products: products.data as AdminProduct[],
        categories: categories.data as AdminCategory[],
      };
    },
    photoUrl(path: string) {
      return client.storage.from("product-photos").getPublicUrl(path).data
        .publicUrl;
    },
    async saveProduct(
      values: ProductValues,
      original: AdminProduct | null,
      photo?: Blob,
    ) {
      let uploaded: string | undefined;
      if (photo) {
        const path = `products/${crypto.randomUUID()}.jpg`;
        const { error } = await client.storage
          .from("product-photos")
          .upload(path, photo, { contentType: "image/jpeg", upsert: false });
        check(error);
        uploaded = path;
      }
      try {
        const { data, error } = await client.rpc("save_product", {
          p_id: original?.id ?? null,
          p_expected_version: original?.version ?? null,
          p_name: values.name,
          p_category_id: values.category_id,
          p_price_cents: values.price_cents,
          p_previous_price_cents: values.previous_price_cents,
          p_image_path: uploaded ?? values.image_path,
          p_active: values.active,
        });
        check(error);
        return data as AdminProduct;
      } catch (error) {
        // Only a definite server rejection permits cleanup. Network failures may
        // have committed, so retain that image rather than break a saved product.
        if (uploaded && error instanceof AdminError && error.code !== "network")
          await client.storage
            .from("product-photos")
            .remove([uploaded])
            .catch(() => {});
        throw error;
      }
    },
    async saveCategory(name: string, id?: string) {
      const query = id
        ? client.from("categories").update({ name: name.trim() }).eq("id", id)
        : client.from("categories").insert({ name: name.trim() });
      const { error } = await query;
      check(error);
    },
    async removeCategory(id: string) {
      const { error } = await client.rpc("remove_category", { p_id: id });
      check(error);
    },
    async setCategoryActive(id: string, active: boolean) {
      const { error } = await client.rpc("archive_category", {
        p_id: id,
        p_active: active,
      });
      check(error);
    },
  };
}
export type AdminApi = ReturnType<typeof createAdminApi>;
