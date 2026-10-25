import { expect, test } from "vitest";
import { createOrderSnapshot, orderSelectionKey } from "./model";

const input = {
  customerName: "  João da Silva  ",
  notes: " Entregar à tarde ",
  now: new Date("2026-10-24T02:00:00Z"),
  pendingChanges: false,
  catalogReady: true,
  items: [
    { id: "1", code: "P001", name: "Panela", quantity: 2, priceCents: 6500 },
    { id: "2", name: "Tesoura", quantity: 1, priceCents: 2500 },
  ],
};
test("snapshot copia itens, limpa campos e soma em centavos", () => {
  const order = createOrderSnapshot(input);
  expect(order.customerName).toBe("João da Silva");
  expect(order.sellerName).toBe("Antônio Marcos Daúde");
  expect(order.totalCents).toBe(15500);
  expect(order.items[0].subtotalCents).toBe(13000);
  expect(order.items[0]).not.toBe(input.items[0]);
});
test.each([
  { customerName: "   " },
  { customerName: "a".repeat(121) },
  { notes: "a".repeat(1001) },
  { items: [] },
  { pendingChanges: true },
  { catalogReady: false },
  { items: [{ ...input.items[0], unavailable: true }] },
  { items: [{ ...input.items[0], priceCents: Number.MAX_SAFE_INTEGER }] },
  { items: [{ ...input.items[0], quantity: 0 }] },
])("recusa pedido inválido %j", (override) => {
  expect(() => createOrderSnapshot({ ...input, ...override })).toThrow();
});
test("key detecta mudanças sem depender da referência do array", () => {
  expect(orderSelectionKey(input.items, false)).toBe(
    orderSelectionKey([...input.items], false),
  );
  expect(orderSelectionKey(input.items, false)).not.toBe(
    orderSelectionKey(input.items, true),
  );
  for (const change of [
    { name: "Outro" },
    { quantity: 3 },
    { priceCents: 4 },
    { unavailable: true },
  ]) {
    expect(orderSelectionKey(input.items, false)).not.toBe(
      orderSelectionKey([{ ...input.items[0], ...change }], false),
    );
  }
});
