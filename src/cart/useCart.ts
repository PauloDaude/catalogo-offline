import { useEffect, useRef, useState } from "react";

import type { Product } from "../catalog/types";
import {
  CART_KEY,
  parseCart,
  addItem,
  setQuantity,
  cartTotal,
  changesFor,
  acceptCatalog,
  type CartItem,
} from "./model";

export function useCart(products: Product[], catalogReady: boolean) {
  const [data, setData] = useState(() => {
    try {
      return {
        items: parseCart(localStorage.getItem(CART_KEY)),
        persistent: true,
      };
    } catch {
      return { items: [] as CartItem[], persistent: false };
    }
  });
  const current = useRef(data);

  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (event.key !== CART_KEY && event.key !== null) return;

      try {
        // Queued events may contain an older snapshot than storage does now.
        // Adopt the latest value without echoing it back to other tabs.
        const next = {
          items: parseCart(localStorage.getItem(CART_KEY)),
          persistent: true,
        };
        current.current = next;
        setData(next);
      } catch {
        current.current = { ...current.current, persistent: false };
        setData(current.current);
      }
    };
    window.addEventListener("storage", receive);

    return () => window.removeEventListener("storage", receive);
  }, []);

  const mutate = (fn: (items: CartItem[]) => CartItem[]) => {
    let base = current.current.items;

    if (current.current.persistent) {
      try {
        base = parseCart(localStorage.getItem(CART_KEY));
      } catch {
        /* Keep the in-memory selection if storage is inaccessible. */
      }
    }

    const next = { items: fn(base), persistent: true };

    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next.items));
    } catch {
      next.persistent = false;
    }

    current.current = next;
    setData(next);
  };

  return {
    ...data,
    count: data.items.reduce((sum, item) => sum + item.quantity, 0),
    totalCents: cartTotal(data.items),
    changes: catalogReady ? changesFor(data.items, products) : [],
    add: (product: Product) => mutate((items) => addItem(items, product)),
    quantity: (id: string, quantity: number) =>
      mutate((items) => setQuantity(items, id, quantity)),
    remove: (id: string) =>
      mutate((items) => items.filter((item) => item.id !== id)),
    clear: () => mutate(() => []),
    acceptChanges: () => {
      if (catalogReady) mutate((items) => acceptCatalog(items, products));
    },
  };
}

export type Cart = ReturnType<typeof useCart>;
