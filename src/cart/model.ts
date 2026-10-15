import type { Product } from "../catalog/types";

export type CartItem = Pick<Product, "id" | "name" | "priceCents"> & {
  code?: string;
  quantity: number;
  unavailable?: boolean;
};

export const CART_KEY = "catalogo-selection-v1";

export function parseCart(raw: string | null): CartItem[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");

    if (!Array.isArray(value) || value.length > 500) return [];

    const ids = new Set<string>();
    const items: CartItem[] = [];

    for (const row of value) {
      if (
        !row ||
        typeof row !== "object" ||
        typeof row.id !== "string" ||
        !row.id ||
        ids.has(row.id) ||
        typeof row.name !== "string" ||
        !row.name.trim() ||
        !Number.isSafeInteger(row.priceCents) ||
        row.priceCents < 0 ||
        !Number.isInteger(row.quantity) ||
        row.quantity < 1 ||
        row.quantity > 999 ||
        (row.unavailable !== undefined &&
          typeof row.unavailable !== "boolean") ||
        (row.code !== undefined &&
          (typeof row.code !== "string" || !/^P\d{3}$/.test(row.code)))
      )
        return [];

      ids.add(row.id);
      items.push({
        id: row.id,
        name: row.name,
        priceCents: row.priceCents,
        quantity: row.quantity,
        ...(row.code === undefined ? {} : { code: row.code }),
        ...(row.unavailable === undefined
          ? {}
          : { unavailable: row.unavailable }),
      });
    }

    return items;
  } catch {
    return [];
  }
}

export function addItem(items: CartItem[], product: Product): CartItem[] {
  const found = items.find((item) => item.id === product.id);

  if (found)
    return setQuantity(
      items.map((item) =>
        item.id === product.id
          ? { ...item, code: item.code ?? product.code }
          : item,
      ),
      product.id,
      Math.min(999, found.quantity + 1),
    );

  return [
    ...items,
    {
      id: product.id,
      code: product.code,
      name: product.name,
      priceCents: product.priceCents,
      quantity: 1,
    },
  ];
}

export function setQuantity(
  items: CartItem[],
  id: string,
  quantity: number,
): CartItem[] {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999)
    return items;

  return items.map((item) => (item.id === id ? { ...item, quantity } : item));
}

export function cartTotal(items: CartItem[]): number | null {
  let total = 0;

  for (const item of items) {
    if (item.unavailable) continue;

    total += item.priceCents * item.quantity;

    if (!Number.isSafeInteger(total)) return null;
  }

  return total;
}

export function changesFor(items: CartItem[], products: Product[]): string[] {
  const byId = new Map(products.map((product) => [product.id, product]));

  return items.flatMap((item) => {
    const current = byId.get(item.id);

    if (!current)
      return item.unavailable ? [] : [`${item.name} não está mais disponível.`];

    if (item.unavailable) return [`${item.name} voltou a ficar disponível.`];

    if (current.priceCents !== item.priceCents)
      return [`O preço de ${item.name} mudou.`];

    return item.code !== current.code
      ? [`A identificação de ${item.name} foi atualizada.`]
      : [];
  });
}

export function acceptCatalog(
  items: CartItem[],
  products: Product[],
): CartItem[] {
  const byId = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const current = byId.get(item.id);

    return current
      ? {
          id: current.id,
          code: current.code,
          name: current.name,
          priceCents: current.priceCents,
          quantity: item.quantity,
          unavailable: false,
        }
      : { ...item, unavailable: true };
  });
}
