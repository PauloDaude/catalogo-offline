import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CatalogPage } from "./CatalogPage";
import { snapshotA } from "../test/fixtures";

beforeEach(() => window.history.replaceState(null, "", "/?visualizacao=cards"));

test("usuário encontra produto por nome e categoria", async () => {
  render(
    <CatalogPage
      products={snapshotA.products}
      images={new Map()}
    />,
  );
  const user = userEvent.setup();
  await user.type(screen.getByRole("searchbox"), "tesoura");
  expect(screen.getByText("Tesoura de cozinha")).toBeVisible();
  expect(screen.queryByText("Lanterna 1")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /^Iluminação$/ }));
  expect(screen.getByText("Nenhum produto encontrado")).toBeVisible();
});

test("nome com markup aparece como texto", () => {
  render(
    <CatalogPage
      products={[
        { ...snapshotA.products[0], name: "<img src=x onerror=alert(1)>" },
      ]}
      images={new Map()}
    />,
  );
  expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
});

test("pesquisa e categoria são compartilhadas entre folhear e grade", async () => {
  window.history.replaceState(null, "", "/");
  const user = userEvent.setup();
  render(
    <CatalogPage
      products={snapshotA.products}
      images={new Map()}
    />,
  );

  expect(screen.getAllByRole("searchbox")).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Iluminação" }));
  await user.type(screen.getByRole("searchbox"), "Lanterna 1");
  expect(screen.getByRole("button", { name: "Ver Lanterna 1" })).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Ver grade" }));
  expect(screen.getByRole("searchbox")).toHaveValue("Lanterna 1");
  expect(screen.getByRole("button", { name: "Iluminação" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "Ver Lanterna 1" })).toBeVisible();
  await user.click(screen.getByRole("tab", { name: "Folhear catálogo" }));
  expect(screen.getByRole("searchbox")).toHaveValue("Lanterna 1");
  expect(screen.queryByText("Produtos por tela")).not.toBeInTheDocument();
});

test("renomear a categoria selecionada não deixa filtro invisível ativo", async () => {
  const product = { ...snapshotA.products[0], category: "Original" };
  const { rerender } = render(
    <CatalogPage
      products={[product]}
      images={new Map()}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Original" }),
  );
  rerender(
    <CatalogPage
      products={[{ ...product, category: "Renomeada" }]}
      images={new Map()}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Todas" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText(product.name)).toBeVisible();
});
