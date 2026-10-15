import { expect, test } from "vitest";

import { snapshotA } from "../test/fixtures";
import {
  parseCart,
  addItem,
  setQuantity,
  cartTotal,
  changesFor,
  acceptCatalog,
} from "./model";

const product = snapshotA.products[0];

test("adicionar repetido agrupa quantidades sem duplicar produto", () => {
  const result = addItem(addItem([], product), product);
  expect(result).toHaveLength(1);
  expect(result[0].quantity).toBe(2);
});

test("total usa centavos inteiros e exclui indisponíveis", () => {
  expect(
    cartTotal([
      { id: "a", name: "A", priceCents: 10, quantity: 3 },
      { id: "b", name: "B", priceCents: 20, quantity: 1 },
      { id: "c", name: "C", priceCents: 500, quantity: 1, unavailable: true },
    ]),
  ).toBe(50);
});

test("quantidade tem limite e não aceita fração nem negativo", () => {
  const items = addItem([], product);
  expect(setQuantity(items, product.id, 3)[0].quantity).toBe(3);

  for (const q of [0, -1, 1.2, 1000, NaN])
    expect(setQuantity(items, product.id, q)).toEqual(items);

  expect(addItem([{ ...items[0], quantity: 999 }], product)[0].quantity).toBe(
    999,
  );
});

test("JSON salvo inválido não impede abrir carrinho", () => {
  for (const raw of [
    "broken",
    "{}",
    "[null]",
    '[{"id":"a","name":"A","quantity":-1,"priceCents":20}]',
  ])
    expect(parseCart(raw)).toEqual([]);

  expect(
    parseCart(
      JSON.stringify([{ id: "a", name: "A", quantity: 2, priceCents: 20 }]),
    ),
  ).toEqual([{ id: "a", name: "A", quantity: 2, priceCents: 20 }]);
});

test("itens salvos duplicados são rejeitados", () => {
  const item = { id: "a", name: "A", quantity: 1, priceCents: 20 };
  expect(parseCart(JSON.stringify([item, item]))).toEqual([]);
});

test("preço muda somente após aceitar atualização", () => {
  const items = addItem([], product);
  const changed = [{ ...product, priceCents: 3000 }];
  expect(changesFor(items, changed)).toHaveLength(1);
  expect(cartTotal(items)).toBe(2500);
  const accepted = acceptCatalog(items, changed);
  expect(cartTotal(accepted)).toBe(3000);
  expect(changesFor(accepted, changed)).toEqual([]);
});

test("produto oculto permanece sinalizado e sai do total após aceitar", () => {
  const items = addItem([], product);
  expect(changesFor(items, [])).toHaveLength(1);
  const accepted = acceptCatalog(items, []);
  expect(accepted[0].unavailable).toBe(true);
  expect(cartTotal(accepted)).toBe(0);
  expect(changesFor(accepted, [])).toEqual([]);
  expect(changesFor(accepted, [product])).toHaveLength(1);
});

test("total excessivo não perde precisão silenciosamente", () => {
  expect(
    cartTotal([
      { id: "a", name: "A", priceCents: Number.MAX_SAFE_INTEGER, quantity: 2 },
    ]),
  ).toBeNull();
});

test("código curto é preservado no carrinho salvo e ao ocultar produto", () => {
  const item = addItem([], { ...product, code: "P001" });
  expect(item[0].code).toBe("P001");
  expect(parseCart(JSON.stringify(item))[0].code).toBe("P001");
  expect(acceptCatalog(item, [])[0].code).toBe("P001");
});
