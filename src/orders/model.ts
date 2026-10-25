import type { CartItem } from "../cart/model";

export type OrderLine = Pick<
  CartItem,
  "id" | "code" | "name" | "quantity" | "priceCents"
> & { subtotalCents: number };
export type OrderSnapshot = {
  customerName: string;
  notes: string;
  generatedAt: string;
  sellerName: string;
  items: OrderLine[];
  totalCents: number;
};
export function orderSelectionKey(
  items: CartItem[],
  pendingChanges: boolean,
): string {
  return JSON.stringify([
    pendingChanges,
    items.map(({ id, code, name, quantity, priceCents, unavailable }) => [
      id,
      code,
      name,
      quantity,
      priceCents,
      !!unavailable,
    ]),
  ]);
}
export function createOrderSnapshot(input: {
  customerName: string;
  notes: string;
  items: CartItem[];
  pendingChanges: boolean;
  catalogReady: boolean;
  now: Date;
}): OrderSnapshot {
  const customerName = input.customerName.trim();
  const notes = input.notes.trim();
  if (!customerName || customerName.length > 120)
    throw new Error("Informe o nome do cliente com até 120 caracteres");
  if (notes.length > 1000)
    throw new Error("Use até 1000 caracteres nas observações");
  if (!input.catalogReady)
    throw new Error("Aguarde o carregamento do catálogo");
  if (input.pendingChanges)
    throw new Error("Revise e atualize a seleção antes de gerar o pedido");
  if (!input.items.length) throw new Error("Adicione produtos ao carrinho");
  let totalCents = 0;
  const items = input.items.map((item) => {
    if (item.unavailable)
      throw new Error(
        "Remova os produtos indisponíveis antes de gerar o pedido",
      );
    const subtotalCents = item.quantity * item.priceCents;
    totalCents += subtotalCents;
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 999 ||
      !Number.isSafeInteger(item.priceCents) ||
      item.priceCents < 0 ||
      !Number.isSafeInteger(subtotalCents) ||
      !Number.isSafeInteger(totalCents)
    )
      throw new Error("Confira as quantidades e os valores do carrinho");
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      quantity: item.quantity,
      priceCents: item.priceCents,
      subtotalCents,
    };
  });
  return {
    customerName,
    notes,
    generatedAt: input.now.toISOString(),
    sellerName: "Antônio Marcos Daúde",
    items,
    totalCents,
  };
}
