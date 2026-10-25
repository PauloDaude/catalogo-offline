import type { OrderSnapshot } from "./model";
import { price } from "../catalog/price";

export function formatWhatsAppOrder(order: OrderSnapshot): string {
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Araguaina",
  }).format(new Date(order.generatedAt));
  return [
    "*PEDIDO — CIRANDINHA*",
    `*Cliente:* ${order.customerName}`,
    `*Data:* ${date}`,
    `*Vendedor:* ${order.sellerName}`,
    "",
    ...order.items.flatMap((item, index) => [
      `*${index + 1}. ${item.code ? "#" + item.code + " — " : ""}${item.name}*`,
      `${item.quantity} × ${price(item.priceCents)} = ${price(item.subtotalCents)}`,
      "",
    ]),
    `*TOTAL: ${price(order.totalCents)}*`,
    ...(order.notes ? ["", `*Observações:* ${order.notes}`] : []),
  ].join("\n");
}
export function orderWhatsAppUrl(order: OrderSnapshot): string {
  return `https://wa.me/556296146244?text=${encodeURIComponent(formatWhatsAppOrder(order))}`;
}
