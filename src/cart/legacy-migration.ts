import { CART_KEY, LEGACY_CART_KEY, parseCart, type CartItem } from "./model";
export const serializeCart = (items: CartItem[]) =>
  JSON.stringify({ schemaVersion: 2, items });
export function readCartStorage(): { items: CartItem[]; persistent: boolean } {
  const existing = localStorage.getItem(CART_KEY);
  if (existing !== null)
    return { items: parseCart(existing), persistent: true };
  const legacy = parseCart(localStorage.getItem(LEGACY_CART_KEY));
  try {
    localStorage.setItem(CART_KEY, serializeCart(legacy));
    return { items: legacy, persistent: true };
  } catch {
    return { items: legacy, persistent: false };
  }
}
