import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminCategory,
  AdminProduct,
  ProductValues,
  ProductQuery,
  CategoryProduct,
} from "./types";

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
    async listProducts(query: ProductQuery) {
      const { data, error } = await client.rpc("list_admin_products_v2", {
        p_page: query.page,
        p_query: query.query,
        p_category: query.category || null,
        p_visibility: query.visibility,
      });
      check(error);
      return data as { products: AdminProduct[]; total: number };
    },
    async listCategories() {
      const { data, error } = await client
        .from("categories")
        .select("id,name,active")
        .order("name");
      check(error);
      return data as AdminCategory[];
    },
    async listCategoryProducts(category: string, activeOnly: boolean) {
      const { data, error } = await client.rpc("list_admin_category_products", {
        p_category: category,
        p_active_only: activeOnly,
      });
      check(error);
      return data as CategoryProduct[];
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
      const uploaded: string[] = [];
      async function upload(blob: Blob) {
        const path = `products/${crypto.randomUUID()}.jpg`;
        const { error } = await client.storage
          .from("product-photos")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        check(error);
        uploaded.push(path);
        return path;
      }
      try {
        const image_path = photo ? await upload(photo) : values.image_path;
        const variants = [];
        for (const row of values.variants || []) {
          const { photo: variantPhoto, ...fields } = row;
          variants.push({
            ...fields,
            image_path: variantPhoto
              ? await upload(variantPhoto)
              : row.image_path,
          });
        }
        const { data, error } = await client.rpc("save_product_v2", {
          p_payload: {
            ...values,
            image_path,
            variants,
            id: original?.id ?? null,
            expected_version: original?.version ?? null,
          },
        });
        check(error);
        return data as AdminProduct;
      } catch (error) {
        if (
          uploaded.length &&
          error instanceof AdminError &&
          error.code !== "network"
        )
          await client.storage
            .from("product-photos")
            .remove(uploaded)
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
