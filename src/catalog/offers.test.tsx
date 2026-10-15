import { beforeEach, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CatalogPage } from "./CatalogPage";
import { snapshotA } from "../test/fixtures";

beforeEach(() => localStorage.clear());

test("oferta aparece no card e nos detalhes; carrinho soma o preço atual", async () => {
  const user = userEvent.setup();
  render(
    <CatalogPage
      products={[
        {
          ...snapshotA.products[0],
          priceCents: 6500,
          previousPriceCents: 10000,
        },
      ]}
      images={new Map()}
    />,
  );

  const card = within(screen.getByRole("article"));
  expect(card.getByText("R$ 100,00", { selector: "s" })).toBeVisible();
  expect(card.getByText("35% OFF")).toBeVisible();
  expect(
    card.getByText("R$ 65,00", { selector: ".product-price" }),
  ).toBeVisible();

  await user.click(
    card.getByRole("button", { name: "Ver Tesoura de cozinha" }),
  );
  const details = within(screen.getByRole("dialog"));
  expect(details.getByText("R$ 100,00", { selector: "s" })).toBeVisible();
  expect(details.getByText("35% OFF")).toBeVisible();
  await user.click(
    details.getByRole("button", { name: "Adicionar ao carrinho" }),
  );
  await user.click(details.getByRole("button", { name: /^Fechar$/ }));
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  expect(
    screen.getByText("R$ 65,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
});

test("produto sem preço anterior não anuncia oferta", () => {
  render(
    <CatalogPage
      products={[snapshotA.products[0]]}
      images={new Map()}
    />,
  );

  expect(screen.queryByText(/OFF/)).not.toBeInTheDocument();
  expect(screen.queryByText("Oferta imperdível")).not.toBeInTheDocument();
  expect(
    screen.getByText("R$ 25,00", { selector: ".product-price" }),
  ).toBeVisible();
});

test("percentual não arredonda o desconto para cima", () => {
  render(
    <CatalogPage
      products={[
        {
          ...snapshotA.products[0],
          priceCents: 6500,
          previousPriceCents: 7990,
        },
      ]}
      images={new Map()}
    />,
  );

  expect(screen.getByText("18% OFF")).toBeVisible();
});
