import { useEffect, useState } from "react";
import type { Cart } from "../cart/useCart";
import { orderSelectionKey, type OrderSnapshot } from "./model";

export type ReadyOrder = {
  file: File;
  preview: Blob | null;
  order: OrderSnapshot;
  key: string;
};
export function useOrderSession(
  cart: Cart,
  catalogReady: boolean,
  productImages: Map<string, string>,
) {
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [ready, setReady] = useState<ReadyOrder | null>(null);
  const key = JSON.stringify([
    catalogReady,
    orderSelectionKey(cart.items, cart.changes.length > 0),
    cart.items.map((item) => productImages.get(item.id)),
  ]);
  useEffect(() => {
    setReady((previous) => (previous?.key === key ? previous : null));
    if (!cart.items.length) {
      setCustomerName("");
      setNotes("");
    }
  }, [key, cart.items.length]);
  return {
    customerName,
    setCustomerName,
    notes,
    setNotes,
    ready: ready?.key === key ? ready : null,
    setReady,
    key,
  };
}
export type OrderSession = ReturnType<typeof useOrderSession>;
