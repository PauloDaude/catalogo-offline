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
  expect(screen.getByRole("tab", { name: "Folhear catálogo" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(
    screen.getByRole("tabpanel", { name: "Folhear catálogo" }),
  ).toBeVisible();
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
  await user.click(screen.getByRole("tab", { name: "Ver em cards" }));
  expect(window.location.search).toBe("?visualizacao=cards");
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

test("faixa adiciona ao carrinho diretamente sem abrir detalhes", async () => {
  window.history.replaceState(null, "", "/?visualizacao=folhear");
  const user = userEvent.setup();
  render(
    <CatalogPage
      products={products}
      images={new Map()}
    />,
  );

  const add = screen.getByRole("button", {
    name: "Adicionar Panela ao carrinho",
  });
  await user.click(add);
  await user.click(add);

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: /Abrir carrinho, 2 itens/ }),
  );
  expect(
    screen.getByText("R$ 130,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
});

test("grade permite escolher de um a cinco produtos e mantém páginas completas", async () => {
  window.history.replaceState(null, "", "/?visualizacao=folhear");
  const user = userEvent.setup();
  const many = Array.from({ length: 11 }, (_, i) => ({
    ...products[0],
    id: `item-${i}`,
    code: `P${i}`,
    name: `Produto ${i}`,
  }));
  render(
    <CatalogPage
      products={many}
      images={new Map()}
    />,
  );

  for (const count of [2, 3, 4, 5, 1]) {
    await user.click(
      screen.getByRole("button", {
        name: `Mostrar ${count} ${count === 1 ? "produto" : "produtos"} por tela`,
      }),
    );
    expect(
      screen.getAllByRole("button", { name: /^Ver Produto/ }),
    ).toHaveLength(count);
  }
  await user.click(
    screen.getByRole("button", { name: "Mostrar 5 produtos por tela" }),
  );
  await user.click(screen.getByRole("button", { name: "Próximo produto" }));
  expect(screen.getByText("Produtos 6–10 de 11")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Próximo produto" }));
  expect(screen.getAllByRole("button", { name: /^Ver Produto/ })).toHaveLength(
    1,
  );
  expect(screen.getByText("Produtos 11–11 de 11")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Próximo produto" }),
  ).toBeDisabled();
  await user.type(screen.getByRole("searchbox"), "Produto 0");
  expect(screen.getByText("Produtos 1–1 de 1")).toBeVisible();
});
