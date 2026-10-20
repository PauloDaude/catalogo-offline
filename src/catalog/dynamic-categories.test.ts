import { expect, test } from "vitest";
import { parseSnapshot } from "./validation";

test("aceita categorias novas e códigos com quatro dígitos sem relaxar caminhos", () => {
  const product = {
    id: "one",
    code: "P1000",
    name: "Caderno",
    category: "Papelaria",
    priceCents: 500,
    imagePath: "products/00000000-0000-0000-0000-000000000003.jpg",
  };
  const snapshot = {
    revision: 1,
    updatedAt: "2026-10-20T10:00:00Z",
    products: [product],
  };
  expect(parseSnapshot(snapshot).products[0].category).toBe("Papelaria");
  for (const imagePath of [
    "https://evil.test/a.jpg",
    "products/../secret.jpg",
    "products/a.svg",
  ]) {
    expect(() =>
      parseSnapshot({ ...snapshot, products: [{ ...product, imagePath }] }),
    ).toThrow();
  }
});
