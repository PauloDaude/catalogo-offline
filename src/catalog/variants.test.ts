import { expect, test } from "vitest";
import { parseSnapshot } from "./validation";
import {
  allImagePaths,
  sellableProducts,
  selectedVariant,
  saleLabel,
} from "./variants";
import { family } from "../test/variant-fixtures";
test("snapshot V2 aceita opções e resolve todas as fotos sem misturar ofertas", () => {
  const snapshot = parseSnapshot({
    schemaVersion: 2,
    revision: 1,
    updatedAt: "2026-10-28T12:00:00Z",
    products: [family],
  });
  expect(snapshot.products[0].priceCents).toBe(1490);
  expect(snapshot.products[0].previousPriceCents).toBeUndefined();
  expect(allImagePaths(snapshot)).toEqual(["photos/a.jpg", "photos/b.jpg"]);
  const items = sellableProducts(snapshot.products);
  expect(items).toHaveLength(2);
  expect(items[1].name).toContain("900 ml");
  expect(items[1].priceCents).toBe(2190);
  expect(selectedVariant(snapshot.products[0], "large")?.imagePath).toBe(
    "photos/b.jpg",
  );
});
test("caixa é uma venda única e rotulada sem multiplicar novamente o preço", () => {
  const box = { kind: "box" as const, packCount: 12, unitsPerPack: 1 };
  expect(saleLabel(box)).toBe("Caixa com 12 unidades");
  expect(
    sellableProducts([
      {
        ...family,
        hasVariants: false,
        variants: undefined,
        priceCents: 3180,
        sale: box,
      },
    ])[0].priceCents,
  ).toBe(3180);
});
test("snapshot rejeita opções duplicadas e caixa com conteúdo inválido", () => {
  const wrap = (product: unknown) => ({
    schemaVersion: 2,
    revision: 1,
    updatedAt: "2026-10-28T12:00:00Z",
    products: [product],
  });
  expect(() =>
    parseSnapshot(
      wrap({ ...family, variants: [family.variants[0], family.variants[0]] }),
    ),
  ).toThrow();
  expect(() =>
    parseSnapshot(
      wrap({
        ...family,
        variants: [
          {
            ...family.variants[0],
            sale: { kind: "box", packCount: 0, unitsPerPack: 1 },
          },
        ],
      }),
    ),
  ).toThrow();
});
