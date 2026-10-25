import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { AddToCartButton } from "./AddToCartButton";
test("mostra +1 ao adicionar, contador acompanha quantidade e limite impede clique", () => {
  const add = vi.fn();
  const view = render(
    <AddToCartButton
      productName="Panela"
      quantity={0}
      onAdd={add}
      compact
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Adicionar Panela ao carrinho" }),
  );
  expect(add).toHaveBeenCalledOnce();
  expect(screen.getByText("+1")).toBeVisible();
  view.rerender(
    <AddToCartButton
      productName="Panela"
      quantity={3}
      onAdd={add}
      compact
    />,
  );
  expect(screen.getByLabelText("3 no carrinho")).toHaveTextContent("3");
  view.rerender(
    <AddToCartButton
      productName="Panela"
      quantity={1}
      onAdd={add}
      compact
    />,
  );
  expect(screen.getByLabelText("1 no carrinho")).toHaveTextContent("1");
  view.rerender(
    <AddToCartButton
      productName="Panela"
      quantity={999}
      onAdd={add}
      compact
    />,
  );
  expect(screen.getByRole("button")).toBeDisabled();
});
