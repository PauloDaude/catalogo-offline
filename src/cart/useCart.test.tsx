import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import { useCart } from "./useCart";
import { CART_KEY } from "./model";
import { snapshotA } from "../test/fixtures";

beforeEach(() => localStorage.clear());

test("evento atrasado de outra aba não regrava seleção antiga nem ressuscita limpeza", () => {
  const { result } = renderHook(() => useCart(snapshotA.products, true));
  act(() => result.current.add(snapshotA.products[0]));
  const oldValue = localStorage.getItem(CART_KEY);
  act(() => result.current.quantity("p0", 2));
  const latest = localStorage.getItem(CART_KEY);
  act(() =>
    window.dispatchEvent(
      new StorageEvent("storage", { key: CART_KEY, newValue: oldValue }),
    ),
  );
  expect(result.current.count).toBe(2);
  expect(localStorage.getItem(CART_KEY)).toBe(latest);
  act(() => {
    localStorage.setItem(CART_KEY, "[]");
    window.dispatchEvent(
      new StorageEvent("storage", { key: CART_KEY, newValue: oldValue }),
    );
  });
  expect(result.current.items).toEqual([]);
  expect(localStorage.getItem(CART_KEY)).toBe("[]");
});

test("duas instâncias usam seleção já salva antes da próxima alteração", () => {
  const first = renderHook(() => useCart(snapshotA.products, true));
  const second = renderHook(() => useCart(snapshotA.products, true));
  act(() => first.result.current.add(snapshotA.products[0]));
  act(() => second.result.current.add(snapshotA.products[1]));
  expect(second.result.current.count).toBe(2);
  act(() => first.result.current.clear());
  act(() =>
    window.dispatchEvent(
      new StorageEvent("storage", { key: CART_KEY, newValue: null }),
    ),
  );
  expect(second.result.current.items).toEqual([]);
});
