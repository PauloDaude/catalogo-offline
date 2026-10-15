import { beforeEach, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CatalogPage } from "./CatalogPage";
import { snapshotA } from "../test/fixtures";

const products = [
  { ...snapshotA.products[0], name: "Panela", priceCents: 6500 },
  {
    ...snapshotA.products[1],
    name: "Utensílios",
    category: "Cozinha" as const,
  },
  { ...snapshotA.products[2], name: "Garrafa", category: "Cozinha" as const },
  snapshotA.products[3],
];

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

test("demonstração folheia Cozinha sem perder a seleção ao comparar os visuais", async () => {
  const user = userEvent.setup();
  render(
    <CatalogPage
      products={products}
      images={new Map()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Folhear catálogo" }));
  expect(window.location.search).toBe("?visualizacao=folhear");
  expect(screen.getByText("Produto 1 de 3")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Produto anterior" }),
  ).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Ver Lanterna 3" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Próximo produto" }));
  await user.click(screen.getByRole("button", { name: "Próximo produto" }));
  expect(screen.getByText("Produto 3 de 3")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Próximo produto" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Ver Garrafa" }));
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Adicionar ao carrinho",
    }),
  );
  await user.click(screen.getByRole("button", { name: /^Fechar$/ }));
  await user.click(screen.getByRole("button", { name: "Visual anterior" }));
  expect(window.location.search).toBe("");
  expect(
    screen.getByRole("button", { name: /Abrir carrinho, 1 item/ }),
  ).toBeVisible();
});

test("link direto abre o catálogo de páginas e pesquisa volta à primeira página", async () => {
  window.history.replaceState(null, "", "/?visualizacao=folhear");
  const user = userEvent.setup();
  render(
    <CatalogPage
      products={products}
      images={new Map()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Próximo produto" }));
  await user.type(screen.getByRole("searchbox"), "panela");
  expect(screen.getByText("Produto 1 de 1")).toBeVisible();
  expect(screen.getByRole("button", { name: "Ver Panela" })).toBeVisible();
  await user.clear(screen.getByRole("searchbox"));
  await user.type(screen.getByRole("searchbox"), "não existe");
  expect(screen.getByText("Nenhum produto encontrado")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Próximo produto" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Limpar pesquisa" }));
  expect(screen.getByText("Produto 1 de 3")).toBeVisible();
});
