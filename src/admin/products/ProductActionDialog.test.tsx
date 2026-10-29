import { render, screen, within } from "@testing-library/react";
import { test, expect } from "vitest";
import { ProductActionDialog } from "./ProductActionDialog";
const visible = {
  id: "a",
  code: "P001",
  name: "Visível",
  version: 1,
  active: true,
};
const hidden = {
  ...visible,
  id: "b",
  code: "P002",
  name: "Oculto",
  active: false,
};
const props = {
  busy: false,
  error: "",
  onCancel: () => {},
  onConfirm: () => {},
};
test("modal mostra os que serão ocultados e os já ocultos", () => {
  render(
    <ProductActionDialog
      {...props}
      action={{ kind: "hide", targets: [visible, hidden] }}
    />,
  );
  expect(
    within(screen.getByRole("region", { name: "Serão ocultados" })).getByText(
      "Visível",
    ),
  ).toBeVisible();
  expect(
    within(
      screen.getByRole("region", {
        name: "Já estão ocultos, não serão alterados",
      }),
    ).getByText("Oculto"),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Ocultar produto" })).toBeEnabled();
});
test("sem elegíveis explica a condição e desabilita só a confirmação", () => {
  render(
    <ProductActionDialog
      {...props}
      action={{ kind: "hide", targets: [hidden] }}
    />,
  );
  expect(
    screen.getByText("Nenhum produto precisa desta alteração"),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Ocultar produtos" }),
  ).toBeDisabled();
});
test("exclusão em lote distingue ocultos e visíveis", () => {
  render(
    <ProductActionDialog
      {...props}
      action={{ kind: "delete", targets: [visible, hidden] }}
    />,
  );
  expect(
    within(screen.getByRole("region", { name: "Serão excluídos" })).getByText(
      "Oculto",
    ),
  ).toBeVisible();
  expect(
    within(
      screen.getByRole("region", {
        name: "Precisam ser ocultados antes de excluir",
      }),
    ).getByText("Visível"),
  ).toBeVisible();
});

test("mostrar também distingue os já visíveis", () => {
  render(
    <ProductActionDialog
      {...props}
      action={{ kind: "show", targets: [visible, hidden] }}
    />,
  );
  expect(
    within(screen.getByRole("region", { name: "Serão mostrados" })).getByText(
      "Oculto",
    ),
  ).toBeVisible();
  expect(
    within(
      screen.getByRole("region", {
        name: "Já estão visíveis, não serão alterados",
      }),
    ).getByText("Visível"),
  ).toBeVisible();
});
