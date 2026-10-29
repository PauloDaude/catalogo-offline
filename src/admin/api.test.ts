import { expect, test, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminApi } from "./api";

test("pagina no servidor com filtros parametrizados e total mesmo sem itens", async () => {
  const rpc = vi
    .fn()
    .mockResolvedValue({ data: { products: [], total: 105 }, error: null });
  const api = createAdminApi({ rpc } as unknown as SupabaseClient);
  expect(
    await api.listProducts({
      page: 7,
      query: "açúcar, (%)",
      category: "c",
      visibility: "hidden",
    }),
  ).toEqual({ products: [], total: 105 });
  expect(rpc).toHaveBeenCalledWith("list_admin_products_v2", {
    p_page: 7,
    p_query: "açúcar, (%)",
    p_category: "c",
    p_visibility: "hidden",
  });
});

test("vínculos de categorias não são truncados pelo limite PostgREST", async () => {
  const rpc = vi.fn().mockResolvedValue({
    data: Array.from({ length: 1025 }, (_, id) => ({ id: String(id) })),
    error: null,
  });
  const api = createAdminApi({ rpc } as unknown as SupabaseClient);
  expect(await api.listCategoryProducts("c", false)).toHaveLength(1025);
  expect(rpc).toHaveBeenCalledWith("list_admin_category_products", {
    p_category: "c",
    p_active_only: false,
  });
});

test("falha da consulta não se transforma em lista vazia", async () => {
  const rpc = vi
    .fn()
    .mockResolvedValue({ data: null, error: { code: "42501" } });
  const api = createAdminApi({ rpc } as unknown as SupabaseClient);
  await expect(
    api.listProducts({ page: 1, query: "", category: "", visibility: "all" }),
  ).rejects.toMatchObject({ code: "denied" });
});

test("ações usam uma RPC de lote e exclusão com versão, sem salvar produtos individualmente", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: { updated: 2 }, error: null });
  const api = createAdminApi({ rpc } as unknown as SupabaseClient);
  expect(
    await api.setProductsVisibility(
      [
        { id: "a", version: 3 },
        { id: "b", version: 7 },
      ],
      false,
    ),
  ).toEqual({ updated: 2 });
  expect(rpc).toHaveBeenCalledWith("set_products_visibility", {
    p_items: [
      { id: "a", expected_version: 3 },
      { id: "b", expected_version: 7 },
    ],
    p_active: false,
  });
  await api.removeProduct("a", 3);
  expect(rpc).toHaveBeenLastCalledWith("remove_product", {
    p_id: "a",
    p_expected_version: 3,
  });
});
test("erro do lote informa revisão e não usa mensagem de salvar formulário", async () => {
  const rpc = vi.fn().mockResolvedValue({ error: { code: "40001" } });
  const api = createAdminApi({ rpc } as unknown as SupabaseClient);
  await expect(
    api.setProductsVisibility([{ id: "a", version: 1 }], true),
  ).rejects.toThrow(/Revise a seleção/);
});

test("exclusão em lote usa uma única RPC transacional", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: { deleted: 2 }, error: null });
  const api = createAdminApi({ rpc } as unknown as SupabaseClient);
  expect(
    await api.removeProducts([
      { id: "a", version: 1 },
      { id: "b", version: 2 },
    ]),
  ).toEqual({ deleted: 2 });
  expect(rpc).toHaveBeenCalledWith("remove_products", {
    p_items: [
      { id: "a", expected_version: 1 },
      { id: "b", expected_version: 2 },
    ],
  });
});

test("ocultar e excluir usa uma única RPC com consentimento explícito", async () => {
  const rpc = vi
    .fn()
    .mockResolvedValue({ data: { deleted: 2, hidden: 1 }, error: null });
  const api = createAdminApi({ rpc } as unknown as SupabaseClient);
  expect(
    await api.removeProducts(
      [
        { id: "a", version: 1 },
        { id: "b", version: 2 },
      ],
      true,
    ),
  ).toEqual({ deleted: 2, hidden: 1 });
  expect(rpc).toHaveBeenCalledExactlyOnceWith("remove_products_v2", {
    p_items: [
      { id: "a", expected_version: 1 },
      { id: "b", expected_version: 2 },
    ],
    p_hide_visible: true,
  });
});

test("upload deriva extensão e MIME dos bytes preparados", async () => {
  const upload = vi.fn().mockResolvedValue({ error: null });
  const rpc = vi.fn().mockResolvedValue({ data: { id: "p" }, error: null });
  const client = {
    rpc,
    storage: { from: () => ({ upload }) },
  } as unknown as SupabaseClient;
  const api = createAdminApi(client);
  for (const type of ["image/webp", "image/jpeg"]) {
    await api.saveProduct(
      {
        name: "Foto",
        category_id: "c",
        image_path: "old.jpg",
        active: true,
        price_cents: 100,
        previous_price_cents: null,
      },
      null,
      new Blob(["photo"], { type }),
    );
    expect(upload).toHaveBeenLastCalledWith(
      expect.stringMatching(type === "image/webp" ? /\.webp$/ : /\.jpg$/),
      expect.any(Blob),
      { contentType: type, upsert: false },
    );
  }
  await expect(
    api.saveProduct(
      {
        name: "Foto",
        category_id: "c",
        image_path: "old.jpg",
        active: true,
        price_cents: 100,
        previous_price_cents: null,
      },
      null,
      new Blob(["png"], { type: "image/png" }),
    ),
  ).rejects.toThrow();
  expect(upload).toHaveBeenCalledTimes(2);
});
