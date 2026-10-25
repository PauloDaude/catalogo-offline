import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { Cart } from "../cart/useCart";
import { OrderDialog } from "./OrderDialog";
import { generateOrderPdf } from "./pdf";
import { canShareOrder, shareOrder, downloadOrder } from "./share";
vi.mock("./pdf", () => ({ generateOrderPdf: vi.fn() }));
vi.mock("./share", () => ({
  canShareOrder: vi.fn(() => true),
  shareOrder: vi.fn(),
  downloadOrder: vi.fn(),
}));
const cart = {
  items: [
    { id: "1", code: "P001", name: "Panela", quantity: 2, priceCents: 6500 },
  ],
  changes: [],
  totalCents: 13000,
} as unknown as Cart;
const file = new File(["pdf"], "pedido.pdf", { type: "application/pdf" });
const props = {
  cart,
  catalogReady: true,
  productImages: new Map<string, string>(),
  onBack: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(generateOrderPdf).mockResolvedValue(file);
  vi.mocked(canShareOrder).mockReturnValue(true);
  vi.mocked(shareOrder).mockResolvedValue("shared");
});
async function generate() {
  await userEvent.type(screen.getByLabelText("Nome do cliente"), "João");
  await userEvent.click(screen.getByRole("button", { name: "Gerar PDF" }));
  await screen.findByRole("heading", { name: "Pedido pronto" });
}
test("valida cliente e gera arquivo antes de compartilhar, sem alterar carrinho", async () => {
  render(<OrderDialog {...props} />);
  expect(screen.getByLabelText("Nome do cliente")).toHaveFocus();
  fireEvent.submit(
    screen.getByRole("button", { name: "Gerar PDF" }).closest("form")!,
  );
  expect(generateOrderPdf).not.toHaveBeenCalled();
  await generate();
  expect(generateOrderPdf).toHaveBeenCalledOnce();
  expect(screen.getByText("João")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Compartilhar PDF" }),
  ).toHaveFocus();
  expect(shareOrder).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole("button", { name: "Compartilhar PDF" }),
  );
  expect(shareOrder).toHaveBeenCalledWith(file);
  await userEvent.click(screen.getByRole("button", { name: "Baixar PDF" }));
  expect(downloadOrder).toHaveBeenCalledWith(file);
  expect(cart.items).toHaveLength(1);
});
test("sem Web Share preserva download", async () => {
  vi.mocked(canShareOrder).mockReturnValue(false);
  render(<OrderDialog {...props} />);
  await generate();
  expect(screen.getByText("Baixe o PDF para compartilhar")).toBeVisible();
  expect(screen.getByRole("button", { name: "Baixar PDF" })).toHaveFocus();
  expect(screen.queryByRole("button", { name: "Compartilhar PDF" })).toBeNull();
  expect(screen.getByRole("button", { name: "Baixar PDF" })).toBeEnabled();
});
test("mudança de seleção invalida arquivo pronto", async () => {
  const view = render(<OrderDialog {...props} />);
  await generate();
  view.rerender(
    <OrderDialog
      {...props}
      cart={{
        ...cart,
        items: [{ ...cart.items[0], quantity: 3 }],
        totalCents: 19500,
      }}
    />,
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Compartilhar PDF" }),
    ).toBeNull(),
  );
  expect(screen.getByRole("alert")).toHaveTextContent("seleção mudou");
});
test("mudança durante geração descarta resultado tardio", async () => {
  let resolve!: (file: File) => void;
  vi.mocked(generateOrderPdf).mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const view = render(<OrderDialog {...props} />);
  await userEvent.type(screen.getByLabelText("Nome do cliente"), "João");
  await userEvent.click(screen.getByRole("button", { name: "Gerar PDF" }));
  expect(screen.getByRole("status")).toHaveTextContent("Gerando");
  view.rerender(
    <OrderDialog
      {...props}
      cart={{ ...cart, changes: ["Preço mudou"] }}
    />,
  );
  await act(async () => resolve(file));
  expect(screen.queryByRole("heading", { name: "Pedido pronto" })).toBeNull();
  expect(screen.getByRole("button", { name: "Gerar PDF" })).toBeDisabled();
});
test("erro recuperável e cancelamento preservam PDF", async () => {
  vi.mocked(generateOrderPdf).mockRejectedValueOnce(
    new Error("Falha de recurso"),
  );
  vi.mocked(shareOrder).mockResolvedValue("cancelled");
  render(<OrderDialog {...props} />);
  await userEvent.type(screen.getByLabelText("Nome do cliente"), "João");
  await userEvent.click(screen.getByRole("button", { name: "Gerar PDF" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Falha de recurso",
  );
  await userEvent.click(screen.getByRole("button", { name: "Gerar PDF" }));
  await screen.findByRole("heading", { name: "Pedido pronto" });
  await userEvent.click(
    screen.getByRole("button", { name: "Compartilhar PDF" }),
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button", { name: "Baixar PDF" })).toBeEnabled();
});
