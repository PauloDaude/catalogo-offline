import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import { ProductForm } from "./ProductForm";
const original = {
  id: "one",
  code: "P001",
  name: "Panela",
  category_id: "c",
  price_cents: 6500,
  previous_price_cents: null,
  image_path: "products/a.jpg",
  active: true,
  version: 1,
};
test("oferta inválida impede salvar e preserva nome digitado", async () => {
  const save = vi.fn();
  const user = userEvent.setup();
  render(
    <ProductForm
      product={original}
      categories={[{ id: "c", name: "Cozinha", active: true }]}
      onSave={save}
      onCancel={() => {}}
      photoUrl={() => ""}
    />,
  );
  await user.click(screen.getByLabelText("Produto em oferta"));
  await user.type(screen.getByLabelText("Preço anterior (R$)"), "10,00");
  await user.click(screen.getByRole("button", { name: "Salvar produto" }));
  expect(
    await screen.findByText(
      "O preço anterior deve ser maior que o preço atual.",
    ),
  ).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Nome do produto")).toHaveValue("Panela");
});
