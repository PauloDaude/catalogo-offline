import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import { Management } from "./Management";
import type { SupabaseClient } from "@supabase/supabase-js";
const api = vi.hoisted(() => ({
  list: vi.fn(),
  saveProduct: vi.fn(),
  photoUrl: () => "photo.jpg",
  removeCategory: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./api", () => ({
  createAdminApi: () => api,
  explainError: () => "Erro",
}));
test("Todos é o padrão e ocultar exige confirmação", async () => {
  api.list.mockResolvedValue({
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
  api.list.mockResolvedValue(initial);
  render(<Management client={{} as SupabaseClient} />);
  await screen.findByText("Produto atual");
  await user.click(screen.getByRole("button", { name: /Categoria$/ }));
  await user.click(screen.getByRole("option", { name: "Antiga" }));
  await user.click(screen.getByRole("button", { name: "Categorias" }));
  await user.click(screen.getByRole("button", { name: "Remover Antiga" }));
  api.list.mockResolvedValue({
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
