import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductBulkActions } from "./ProductBulkActions";
const a = {
  id: "a",
  name: "Produto A",
  code: "P001",
  active: true,
  version: 1,
};
test("conta seleção entre páginas e mostra estado parcial da página atual", async () => {
  const toggle = vi.fn(),
    hide = vi.fn();
  render(
    <ProductBulkActions
      products={[a, { ...a, id: "b" }]}
      selection={
        new Map([
          ["a", a],
          ["other", { ...a, id: "other" }],
        ])
      }
      disabled={false}
      onTogglePage={toggle}
      onClear={() => {}}
      onShow={() => {}}
      onHide={hide}
    />,
  );
  expect(
    screen.getByRole("checkbox", { name: "Selecionar página" }),
  ).toBePartiallyChecked();
  expect(screen.getByText("2 selecionados")).toBeVisible();
  await userEvent.click(
    screen.getByRole("button", { name: "Ocultar selecionados" }),
  );
  expect(hide).toHaveBeenCalledOnce();
  await userEvent.click(
    screen.getByRole("checkbox", { name: "Selecionar página" }),
  );
  expect(toggle).toHaveBeenCalledOnce();
});
