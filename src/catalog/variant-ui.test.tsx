import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ProductCard } from "./ProductCard";
import { parseSnapshot } from "./validation";
import { family } from "../test/variant-fixtures";
test("opções exigem escolha antes da adição e usam preço e foto próprios", async () => {
  const product = parseSnapshot({
      schemaVersion: 2,
      revision: 1,
      updatedAt: "2026-10-28T00:00:00Z",
      products: [family],
    }).products[0],
    add = vi.fn();
  render(
    <ProductCard
      product={product}
      image="cover.jpg"
      images={new Map([["photos/b.jpg", "large.jpg"]])}
      onAdd={add}
      quantityFor={() => 2}
    />,
  );
  expect(screen.getByText("A partir de")).toBeVisible();
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "Escolher opções de Processador" }),
  );
  expect(
    screen.getByRole("button", { name: "Adicionar ao carrinho" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: /Capacidade$/ }));
  await user.click(screen.getByRole("option", { name: /900 ml/ }));
  expect(screen.getByRole("dialog").querySelector("img")).toHaveAttribute(
    "src",
    "large.jpg",
  );
  await user.click(
    screen.getByRole("button", { name: "Adicionar ao carrinho" }),
  );
  expect(add).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "large",
      priceCents: 2190,
      variantLabel: "900 ml",
    }),
  );
});
