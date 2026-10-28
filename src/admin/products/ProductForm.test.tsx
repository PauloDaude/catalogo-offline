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

test("campos ficam bloqueados enquanto o salvamento está em andamento", async () => {
  const user = userEvent.setup();
  render(
    <ProductForm
      product={original}
      categories={[{ id: "c", name: "Cozinha", active: true }]}
      onSave={() => new Promise(() => {})}
      onCancel={() => {}}
      photoUrl={() => ""}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Salvar produto" }));
  expect(screen.getByLabelText("Nome do produto")).toBeDisabled();
  expect(screen.getByLabelText("Preço atual (R$)")).toBeDisabled();
  expect(screen.getByRole("button", { name: /Categoria/ })).toBeDisabled();
  expect(screen.getByRole("checkbox")).toBeDisabled();
});

test("remover imagem deixa área para escolher outra e impede salvar sem foto", async () => {
  const user = userEvent.setup(),
    save = vi.fn();
  render(
    <ProductForm
      product={original}
      categories={[{ id: "c", name: "Cozinha", active: true }]}
      onSave={save}
      onCancel={() => {}}
      photoUrl={() => "image.jpg"}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Remover imagem" }));
  expect(
    screen.queryByRole("img", { name: "Prévia da foto do produto" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Escolher imagem" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Salvar produto" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Escolha uma foto para o produto",
  );
  expect(save).not.toHaveBeenCalled();
});

test("converter para variantes confirma e salva opções com preços próprios", async () => {
  const save = vi.fn(),
    user = userEvent.setup();
  render(
    <ProductForm
      product={original}
      categories={[{ id: "c", name: "Cozinha", active: true }]}
      onSave={save}
      onCancel={() => {}}
      photoUrl={() => "photo.jpg"}
    />,
  );
  await user.click(screen.getByRole("button", { name: /Tipo de produto$/ }));
  await user.click(
    screen.getByRole("option", { name: "Produto com variantes" }),
  );
  await user.click(screen.getByRole("button", { name: "Alterar tipo" }));
  await user.type(screen.getByLabelText("Característica"), "Capacidade");
  await user.type(screen.getByLabelText("Nome da opção 1"), "500 ml");
  await user.type(screen.getByLabelText("Preço da opção 1 (R$)"), "14,90");
  await user.type(screen.getByLabelText("Nome da opção 2"), "900 ml");
  await user.type(screen.getByLabelText("Preço da opção 2 (R$)"), "21,90");
  await user.click(screen.getByRole("button", { name: "Salvar produto" }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      has_variants: true,
      price_cents: null,
      variants: expect.arrayContaining([
        expect.objectContaining({ label: "500 ml", price_cents: 1490 }),
        expect.objectContaining({ label: "900 ml", price_cents: 2190 }),
      ]),
    }),
    undefined,
  );
});
