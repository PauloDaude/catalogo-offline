import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CatalogPage } from "../catalog/CatalogPage";
import { generateOrderPdf } from "../orders/pdf";
vi.mock("../orders/pdf", () => ({
  generateOrderPdf: vi.fn(
    async () => new File(["pdf"], "pedido.pdf", { type: "application/pdf" }),
  ),
}));
vi.mock("../orders/preview", () => ({
  renderOrderPreview: vi.fn(async () => {
    throw new Error("Sem preview no teste");
  }),
}));
import { snapshotA } from "../test/fixtures";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/?visualizacao=cards");
});

const renderCatalog = () =>
  render(
    <CatalogPage
      products={snapshotA.products}
      images={new Map()}
    />,
  );

async function addProduct(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: "Ver Tesoura de cozinha" }),
  );
  await user.click(
    screen.getByRole("button", { name: /^Adicionar ao carrinho/ }),
  );
  await user.click(screen.getByRole("button", { name: /^Fechar$/ }));
}

test("adiciona, ajusta e remove produtos com total atualizado", async () => {
  const user = userEvent.setup();
  renderCatalog();
  await addProduct(user);
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  const dialog = within(screen.getByRole("dialog"));
  expect(
    dialog.getByText("R$ 25,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
  await user.click(
    dialog.getByRole("button", {
      name: "Aumentar quantidade de Tesoura de cozinha",
    }),
  );
  expect(
    dialog.getByText("R$ 50,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
  await user.click(
    dialog.getByRole("button", { name: "Remover Tesoura de cozinha" }),
  );
  expect(dialog.getByText("Seu carrinho está vazio")).toBeVisible();
});

test("reabrir recupera seleção e limpar exige confirmação", async () => {
  const user = userEvent.setup();
  const first = renderCatalog();
  await addProduct(user);
  first.unmount();
  renderCatalog();
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  expect(
    screen.getByText("R$ 25,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: /^Limpar carrinho$/ }));
  await user.click(screen.getByRole("button", { name: /^Cancelar$/ }));
  expect(
    screen.getByText("R$ 25,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: /^Limpar carrinho$/ }));
  await user.click(screen.getByRole("button", { name: "Sim, limpar" }));
  expect(screen.getByText("Seu carrinho está vazio")).toBeVisible();
});

test("sincronização avisa antes de mudar o total", async () => {
  const user = userEvent.setup();
  const view = renderCatalog();
  await addProduct(user);
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  view.rerender(
    <CatalogPage
      products={[{ ...snapshotA.products[0], priceCents: 3000 }]}
      images={new Map()}
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "O preço de Tesoura de cozinha mudou",
  );
  expect(
    screen.queryByText("R$ 30,00", { selector: ".cart-grand-total" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Atualizar seleção" }));
  expect(
    screen.getByText("R$ 30,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
});

test("sem armazenamento continua somando e informa limite da persistência", async () => {
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Denied", "SecurityError");
  });

  try {
    const user = userEvent.setup();
    renderCatalog();
    await addProduct(user);
    await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("apenas nesta aba");
    expect(
      screen.getByText("R$ 25,00", { selector: ".cart-grand-total" }),
    ).toBeVisible();
  } finally {
    spy.mockRestore();
  }
});

test("carrinho carregando não trata produtos como removidos", async () => {
  const user = userEvent.setup();
  const view = renderCatalog();
  await addProduct(user);
  view.rerender(
    <CatalogPage
      products={[]}
      catalogReady={false}
      images={new Map()}
    />,
  );
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.getByText("R$ 25,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
});

test("carrinho reutiliza a foto atual e mostra indicação se a imagem falhar", async () => {
  const user = userEvent.setup();
  const view = render(
    <CatalogPage
      products={snapshotA.products}
      images={new Map([["photos/p0.jpg", "blob:foto-local"]])}
    />,
  );
  await addProduct(user);
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  const dialog = within(screen.getByRole("dialog"));
  const thumbnail = dialog.getByRole("img", { name: "Tesoura de cozinha" });
  expect(thumbnail).toHaveAttribute("src", "blob:foto-local");
  fireEvent.error(thumbnail);
  expect(dialog.getByRole("img", { name: "Foto indisponível" })).toBeVisible();

  view.rerender(
    <CatalogPage
      products={snapshotA.products}
      images={new Map([["photos/p0.jpg", "blob:foto-atualizada"]])}
    />,
  );
  expect(
    dialog.getByRole("img", { name: "Tesoura de cozinha" }),
  ).toHaveAttribute("src", "blob:foto-atualizada");
});

test("produto sem foto continua identificado no carrinho", async () => {
  const user = userEvent.setup();
  renderCatalog();
  await addProduct(user);
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByRole("img", { name: "Foto indisponível" })).toBeVisible();
  expect(
    dialog.getByRole("heading", { name: "Tesoura de cozinha" }),
  ).toBeVisible();
  expect(
    dialog.getByText("R$ 25,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
});

test("abre pedido e volta ao carrinho sem perder itens ou foco", async () => {
  const user = userEvent.setup();
  renderCatalog();
  await addProduct(user);
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  await user.click(screen.getByRole("button", { name: "Gerar pedido em PDF" }));
  expect(screen.getByRole("heading", { name: "Pedido em PDF" })).toBeVisible();
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  await user.type(screen.getByLabelText("Nome do cliente"), "João");
  await user.click(screen.getByRole("button", { name: "Voltar ao carrinho" }));
  expect(
    screen.getByText("R$ 25,00", { selector: ".cart-grand-total" }),
  ).toBeVisible();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  expect(
    screen.getByRole("button", { name: "Gerar pedido em PDF" }),
  ).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Gerar pedido em PDF" }));
  expect(screen.getByLabelText("Nome do cliente")).toHaveValue("João");
});

test("reabrir o mesmo carrinho reutiliza PDF, nome e observações sem gerar novamente", async () => {
  const user = userEvent.setup();
  renderCatalog();
  await addProduct(user);
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  await user.click(screen.getByRole("button", { name: "Gerar pedido em PDF" }));
  await user.type(screen.getByLabelText("Nome do cliente"), "Maria");
  await user.type(
    screen.getByLabelText("Observações (opcional)"),
    "Entregar amanhã",
  );
  const before = vi.mocked(generateOrderPdf).mock.calls.length;
  await user.click(screen.getByRole("button", { name: "Gerar PDF" }));
  await screen.findByRole("heading", { name: "Pedido pronto" });
  await user.click(screen.getByRole("button", { name: "Voltar ao carrinho" }));
  await user.click(screen.getByRole("button", { name: "Fechar" }));
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  await user.click(screen.getByRole("button", { name: "Ver pedido em PDF" }));
  expect(screen.getByRole("heading", { name: "Pedido pronto" })).toBeVisible();
  expect(vi.mocked(generateOrderPdf).mock.calls.length).toBe(before + 1);
  await user.click(
    screen.getByRole("button", { name: "Editar dados do pedido" }),
  );
  expect(screen.getByLabelText("Nome do cliente")).toHaveValue("Maria");
  expect(screen.getByLabelText("Nome do cliente")).toHaveFocus();
  expect(screen.getByLabelText("Observações (opcional)")).toHaveValue(
    "Entregar amanhã",
  );
});
