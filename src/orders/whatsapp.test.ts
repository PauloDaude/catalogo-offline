import { expect, test } from "vitest";
import { createOrderSnapshot } from "./model";
import { orderWhatsAppUrl, formatWhatsAppOrder } from "./whatsapp";
test("texto do pedido contém dados e valores, com destino exatamente informado", () => {
  const order = createOrderSnapshot({
    customerName: "João",
    notes: "Entregar à tarde",
    now: new Date("2026-10-24T02:00:00Z"),
    catalogReady: true,
    pendingChanges: false,
    items: [
      {
        id: "1",
        code: "P001",
        name: "Panela & tampa",
        quantity: 2,
        priceCents: 6500,
      },
    ],
  });
  const text = formatWhatsAppOrder(order);
  for (const part of [
    "João",
    "23/10/2026",
    "Antônio Marcos Daúde",
    "#P001",
    "Panela & tampa",
    "2",
    "65,00",
    "130,00",
    "Entregar à tarde",
  ])
    expect(text).toContain(part);
  const url = new URL(orderWhatsAppUrl(order));
  expect(url.origin).toBe("https://wa.me");
  expect(url.pathname).toBe("/556296146244");
  expect(url.searchParams.get("text")).toBe(text);
  expect(text).not.toMatch(/blob:|https?:|<img/);
});
