import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import { Categories } from "./Categories";
import type { AdminApi } from "../api";
test("mostra produtos que impedem arquivar sem enviar a alteração", async () => {
  const archive = vi.fn();
  const user = userEvent.setup();
  render(
    <Categories
      categories={[{ id: "c", name: "Cozinha", active: true }]}
      products={[
        { id: "p", name: "Panela", category_id: "c", active: true } as never,
      ]}
      api={{ setCategoryActive: archive } as unknown as AdminApi}
      onChanged={async () => {}}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Arquivar Cozinha" }));
  expect(await screen.findByText(/Panela/)).toBeInTheDocument();
  expect(archive).not.toHaveBeenCalled();
});

test("não aceita edição do nome durante o envio da categoria", async () => {
  const user = userEvent.setup();
  render(
    <Categories
      categories={[]}
      products={[]}
      api={{ saveCategory: () => new Promise(() => {}) } as unknown as AdminApi}
      onChanged={async () => {}}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Criar categoria" }));
  await user.type(screen.getByLabelText("Nome da categoria"), "Nova categoria");
  await user.click(screen.getByRole("button", { name: "Criar categoria" }));
  expect(screen.getByLabelText("Nome da categoria")).toBeDisabled();
});

test("criar categoria abre modal e remover só aparece em categoria arquivada", async () => {
  const user = userEvent.setup();
  render(
    <Categories
      categories={[
        { id: "a", name: "Ativa", active: true },
        { id: "b", name: "Antiga", active: false },
      ]}
      products={[]}
      api={{} as AdminApi}
      onChanged={async () => {}}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "Remover Ativa" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remover Antiga" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Criar categoria" }));
  expect(screen.getByRole("dialog", { name: "Criar categoria" })).toBeVisible();
  expect(screen.getByLabelText("Nome da categoria")).toBeVisible();
});
