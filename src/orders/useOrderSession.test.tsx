import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import type { Cart } from "../cart/useCart";
import { useOrderSession } from "./useOrderSession";
const cart = {
  items: [
    { id: "1", name: "Panela", code: "P001", quantity: 1, priceCents: 6500 },
  ],
  changes: [],
} as unknown as Cart;
test("mantém arquivo e dados em memória, invalida seleção alterada e limpa atendimento vazio", () => {
  const hook = renderHook(
    ({ cart }) => useOrderSession(cart, true, new Map()),
    { initialProps: { cart } },
  );
  const file = new File(["pdf"], "pedido.pdf");
  act(() => {
    hook.result.current.setCustomerName("João");
    hook.result.current.setNotes("Entrega");
    hook.result.current.setReady({
      file,
      preview: new Blob(),
      order: {
        customerName: "João",
        notes: "Entrega",
        sellerName: "Pai",
        generatedAt: new Date().toISOString(),
        items: [],
        totalCents: 6500,
      },
      key: hook.result.current.key,
    });
  });
  hook.rerender({ cart: { ...cart, items: [...cart.items] } });
  expect(hook.result.current.ready?.file).toBe(file);
  expect(hook.result.current.customerName).toBe("João");
  hook.rerender({
    cart: { ...cart, items: [{ ...cart.items[0], quantity: 2 }] },
  });
  expect(hook.result.current.ready).toBeNull();
  expect(hook.result.current.customerName).toBe("João");
  hook.rerender({ cart: { ...cart, items: [] } });
  expect(hook.result.current.customerName).toBe("");
  expect(hook.result.current.notes).toBe("");
});
