import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi, beforeEach } from "vitest";
import { Management } from "./Management";
import type { SupabaseClient } from "@supabase/supabase-js";
const api = vi.hoisted(() => ({
  listProducts: vi.fn(),
  listCategories: vi.fn(),
  listCategoryProducts: vi.fn().mockResolvedValue([]),
  saveProduct: vi.fn(),
  setProductsVisibility: vi.fn().mockResolvedValue({ updated: 1 }),
  removeProduct: vi.fn().mockResolvedValue(undefined),
  photoUrl: () => "photo.jpg",
  removeCategory: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./api", () => ({
  createAdminApi: () => api,
  explainError: () => "Erro",
}));
beforeEach(() => {
  vi.clearAllMocks();
  api.listCategories.mockResolvedValue([
    { id: "c", name: "Cozinha", active: true },
  ]);
});
test("Todos é o padrão e ocultar exige confirmação", async () => {
  api.listProducts.mockResolvedValue({
    total: 2,
    categories: [{ id: "c", name: "Cozinha", active: true }],
    products: [
      {
        id: "p",
        code: "P001",
        name: "Panela",
        category_id: "c",
        price_cents: 100,
        image_path: "x",
        active: true,
        version: 1,
      },
      {
        id: "h",
        code: "P002",
        name: "Oculto",
        category_id: "c",
        price_cents: 200,
        image_path: "y",
        active: false,
        version: 1,
      },
    ],
  });
  render(<Management client={{} as SupabaseClient} />);
  expect(await screen.findByText("Oculto", { exact: true })).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Ocultar Panela" }));
  expect(api.saveProduct).not.toHaveBeenCalled();
  expect(
    screen.getByRole("dialog", { name: "Ocultar produto?" }),
  ).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(api.saveProduct).not.toHaveBeenCalled();
});

test("remover categoria selecionada retorna o filtro para Todas", async () => {
  const user = userEvent.setup();
  const initial = {
    categories: [
      { id: "old", name: "Antiga", active: false },
      { id: "new", name: "Atual", active: true },
    ],
    products: [
      {
        id: "p",
        code: "P001",
        name: "Produto atual",
        category_id: "new",
        price_cents: 100,
        image_path: "photo.jpg",
        active: true,
        version: 1,
      },
    ],
  };
  api.listCategories.mockResolvedValue(initial.categories);
  api.listProducts.mockResolvedValue({ ...initial, total: 1 });
  render(<Management client={{} as SupabaseClient} />);
  await screen.findByText("Produto atual");
  await user.click(screen.getByRole("button", { name: /Categoria$/ }));
  await user.click(screen.getByRole("option", { name: "Antiga" }));
  await user.click(screen.getByRole("button", { name: "Categorias" }));
  await user.click(screen.getByRole("button", { name: "Remover Antiga" }));
  api.listCategories.mockResolvedValue([initial.categories[1]]);
  api.listProducts.mockResolvedValue({
    ...initial,
    categories: [initial.categories[1]],
  });
  await user.click(screen.getByRole("button", { name: "Remover categoria" }));
  await user.click(screen.getByRole("button", { name: "Produtos" }));
  expect(await screen.findByText("Produto atual")).toBeVisible();
  expect(screen.getByRole("button", { name: /Categoria$/ })).toHaveTextContent(
    "Todas",
  );
});

const product = (i: number) => ({
  id: `p${i}`,
  code: `P${i}`,
  name: `Produto ${i}`,
  category_id: "c",
  price_cents: 100,
  image_path: "x",
  active: true,
  version: 1,
});

test("consulta páginas de 20 no servidor e reinicia ao filtrar", async () => {
  api.listProducts.mockImplementation(async ({ page }) => ({
    products: Array.from({ length: page === 6 ? 5 : 20 }, (_, i) =>
      product((page - 1) * 20 + i + 1),
    ),
    total: 105,
  }));
  const user = userEvent.setup();
  render(<Management client={{} as SupabaseClient} />);
  expect(await screen.findByText("Produto 20", { exact: true })).toBeVisible();
  expect(screen.getByRole("button", { name: "Anterior" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await user.click(screen.getByRole("button", { name: "Próxima" }));
  expect(await screen.findByText("Produto 21", { exact: true })).toBeVisible();
  expect(screen.getByText("Página 2 de 6")).toBeVisible();
  await user.type(screen.getByRole("searchbox"), "açúcar, (%)");
  await waitFor(() =>
    expect(api.listProducts).toHaveBeenLastCalledWith({
      page: 1,
      query: "açúcar, (%)",
      category: "",
      visibility: "all",
    }),
  );
  await user.click(screen.getByRole("button", { name: /Mostrar$/ }));
  await user.click(screen.getByRole("option", { name: "Ocultos" }));
  await waitFor(() =>
    expect(api.listProducts).toHaveBeenLastCalledWith({
      page: 1,
      query: "açúcar, (%)",
      category: "",
      visibility: "hidden",
    }),
  );
});

test("resposta antiga não substitui filtro novo e falha permite repetir", async () => {
  let resolveOld: (value: unknown) => void = () => {};
  api.listProducts
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolveOld = r;
        }),
    )
    .mockResolvedValue({ products: [product(100)], total: 1 });
  const user = userEvent.setup();
  render(<Management client={{} as SupabaseClient} />);
  await user.type(screen.getByRole("searchbox"), "nova");
  expect(await screen.findByText("Produto 100")).toBeVisible();
  resolveOld({ products: [product(1)], total: 105 });
  await waitFor(() =>
    expect(
      screen.queryByText("Produto 1", { exact: true }),
    ).not.toBeInTheDocument(),
  );
  api.listProducts.mockRejectedValueOnce(new Error("rede"));
  await user.type(screen.getByRole("searchbox"), " falha");
  expect(await screen.findByRole("alert")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText("Produto 100")).toBeVisible();
});

test("ocultar último produto da última página retorna à página válida", async () => {
  let total = 21;
  api.listProducts.mockImplementation(async ({ page }) => ({
    products: page === 2 ? (total === 21 ? [product(21)] : []) : [product(1)],
    total,
  }));
  api.setProductsVisibility.mockImplementation(async () => {
    total = 20;
    return { updated: 1 };
  });
  const user = userEvent.setup();
  render(<Management client={{} as SupabaseClient} />);
  await screen.findByText("Produto 1", { exact: true });
  await user.click(screen.getByRole("button", { name: "Próxima" }));
  await screen.findByText("Produto 21", { exact: true });
  await user.click(screen.getByRole("button", { name: /Mostrar$/ }));
  await user.click(screen.getByRole("option", { name: "Visíveis" }));
  await screen.findByText("Produto 1", { exact: true });
  await user.click(screen.getByRole("button", { name: "Próxima" }));
  await user.click(
    await screen.findByRole("button", { name: "Ocultar Produto 21" }),
  );
  await user.click(screen.getByRole("button", { name: "Ocultar produto" }));
  expect(await screen.findByText("Página 1 de 1")).toBeVisible();
  expect(screen.getByRole("button", { name: "Próxima" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("remover a última categoria também limpa o filtro selecionado", async () => {
  api.listCategories.mockResolvedValue([
    { id: "last", name: "Última", active: false },
  ]);
  api.listProducts.mockResolvedValue({ products: [], total: 0 });
  const user = userEvent.setup();
  render(<Management client={{} as SupabaseClient} />);
  await screen.findByText("0 produtos");
  await user.click(screen.getByRole("button", { name: /Categoria$/ }));
  await user.click(screen.getByRole("option", { name: "Última" }));
  await user.click(screen.getByRole("button", { name: "Categorias" }));
  await user.click(screen.getByRole("button", { name: "Remover Última" }));
  api.listCategories.mockResolvedValue([]);
  await user.click(screen.getByRole("button", { name: "Remover categoria" }));
  await user.click(screen.getByRole("button", { name: "Produtos" }));
  await waitFor(() =>
    expect(api.listProducts).toHaveBeenLastCalledWith({
      page: 1,
      query: "",
      category: "",
      visibility: "all",
    }),
  );
});

test("Próxima permanece focada durante e após carregar outra página", async () => {
  let finish: (value: unknown) => void = () => {};
  api.listProducts
    .mockResolvedValueOnce({ products: [product(1)], total: 105 })
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          finish = r;
        }),
    );
  render(<Management client={{} as SupabaseClient} />);
  await screen.findByText("Produto 1", { exact: true });
  const next = screen.getByRole("button", { name: "Próxima" });
  await userEvent.click(next);
  expect(next).toBeInTheDocument();
  expect(next).toHaveFocus();
  finish({ products: [product(21)], total: 105 });
  await screen.findByText("Produto 21", { exact: true });
  expect(next).toHaveFocus();
});
