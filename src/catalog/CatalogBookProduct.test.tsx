import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { CatalogBookProduct } from "./CatalogBookProduct";
import { snapshotA } from "../test/fixtures";
test("feedback +1 pertence apenas ao produto que foi adicionado", () => {
  const props = {
    quantity: 0,
    onAdd: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    isFirst: false,
    isLast: false,
  };
  const view = render(
    <CatalogBookProduct
      {...props}
      product={snapshotA.products[0]}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: `Adicionar ${snapshotA.products[0].name} ao carrinho`,
    }),
  );
  expect(screen.getByText("+1")).toBeVisible();
  view.rerender(
    <CatalogBookProduct
      {...props}
      product={snapshotA.products[1]}
    />,
  );
  expect(screen.queryByText("+1")).toBeNull();
});
