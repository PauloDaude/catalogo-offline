import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ProductCard } from "./ProductCard";
import { snapshotA } from "../test/fixtures";
test("adicionar no card da grade não abre detalhes e reflete quantidade", () => {
  const product = snapshotA.products[0],
    add = vi.fn();
  const view = render(
    <ProductCard
      product={product}
      quantity={0}
      onAdd={add}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: `Adicionar ${product.name} ao carrinho`,
    }),
  );
  expect(add).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).toBeNull();
  view.rerender(
    <ProductCard
      product={product}
      quantity={2}
      onAdd={add}
    />,
  );
  expect(screen.getByLabelText("2 no carrinho")).toBeVisible();
});
