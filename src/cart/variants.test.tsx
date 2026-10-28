import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useCart } from "./useCart";
import { parseSnapshot } from "../catalog/validation";
import { family } from "../test/variant-fixtures";
import { sellableProducts } from "../catalog/variants";
import { CART_KEY, addItem, changesFor } from "./model";
beforeEach(() => localStorage.clear());
const parents = () =>
  parseSnapshot({
    schemaVersion: 2,
    revision: 1,
    updatedAt: "2026-10-28T00:00:00Z",
    products: [family],
  }).products;
test("opções mantêm linhas separadas e carrinho V1 não altera V2", () => {
  const products = parents(),
    choices = sellableProducts(products);
  localStorage.setItem(
    "catalogo-selection-v1",
    JSON.stringify([
      { id: "old", code: "P001", name: "Antigo", priceCents: 100, quantity: 1 },
    ]),
  );
  const { result } = renderHook(() => useCart(products, true));
  act(() => result.current.add(choices[0]));
  act(() => result.current.add(choices[1]));
  expect(result.current.items).toHaveLength(3);
  expect(result.current.totalCents).toBe(3780);
  act(() => {
    localStorage.setItem("catalogo-selection-v1", "[]");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "catalogo-selection-v1" }),
    );
  });
  expect(result.current.items).toHaveLength(3);
  act(() => result.current.clear());
  expect(localStorage.getItem("catalogo-selection-v1")).toBe("[]");
  expect(JSON.parse(localStorage.getItem(CART_KEY)!).items).toEqual([]);
});
test("pai com variantes não entra sem seleção e mudança de caixa exige revisão", () => {
  expect(addItem([], parents()[0])).toEqual([]);
  const box = {
    id: "b",
    code: "P002",
    name: "Coadores",
    category: "Cozinha",
    imagePath: "photos/a.jpg",
    priceCents: 3180,
    sale: { kind: "box" as const, packCount: 12, unitsPerPack: 1 },
  };
  const items = addItem([], sellableProducts([box])[0]);
  expect(items[0].name).toContain("Caixa com 12");
  expect(
    changesFor(
      items,
      sellableProducts([{ ...box, sale: { ...box.sale, packCount: 10 } }]),
    ),
  ).toHaveLength(1);
});

test("carrinho identifica o preço por caixa", async () => {
  const box = {
    id: "b",
    code: "P002",
    name: "Coadores",
    category: "Cozinha",
    imagePath: "photos/a.jpg",
    priceCents: 3180,
    sale: { kind: "box" as const, packCount: 12, unitsPerPack: 1 },
  };
  localStorage.setItem(
    CART_KEY,
    JSON.stringify({
      schemaVersion: 2,
      items: addItem([], sellableProducts([box])[0]),
    }),
  );
  const { result } = renderHook(() => useCart([box], true));
  const { CartPanel } = await import("./CartPanel");
  const { render, screen } = await import("@testing-library/react");
  render(
    <CartPanel
      cart={result.current}
      catalogReady
      productImages={new Map()}
    />,
  );
  const user = (await import("@testing-library/user-event")).default.setup();
  await user.click(screen.getByRole("button", { name: /Abrir carrinho/ }));
  expect(screen.getByText("R$ 31,80 por caixa", { exact: true })).toBeVisible();
});

test("quota ao migrar preserva itens V1 na memória e recupera persistência depois", () => {
  const old = {
    id: "old",
    code: "P001",
    name: "Antigo",
    priceCents: 100,
    quantity: 2,
  };
  localStorage.setItem("catalogo-selection-v1", JSON.stringify([old]));
  const original = Storage.prototype.setItem;
  const spy = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === CART_KEY)
        throw new DOMException("Sem espaço", "QuotaExceededError");
      return original.call(this, key, value);
    });
  const { result } = renderHook(() => useCart([], false));
  expect(result.current.items).toEqual([old]);
  expect(result.current.persistent).toBe(false);
  spy.mockRestore();
  act(() =>
    result.current.add({
      id: "new",
      code: "P002",
      name: "Novo",
      category: "Cozinha",
      imagePath: "photos/a.jpg",
      priceCents: 200,
    }),
  );
  expect(result.current.items).toHaveLength(2);
  expect(result.current.persistent).toBe(true);
  expect(JSON.parse(localStorage.getItem(CART_KEY)!).items).toHaveLength(2);
});
