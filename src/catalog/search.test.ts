import { expect, test } from "vitest";

import { filterProducts } from "./search";
import { snapshotA } from "../test/fixtures";

test("pesquisa ignora caixa e espaços", () => {
  expect(
    filterProducts(snapshotA.products, "  TESOURA  ", "Todas").map((p) => p.id),
  ).toEqual(["p0"]);
});

test("pesquisa ignora acentos", () => {
  expect(
    filterProducts(
      [{ ...snapshotA.products[0], name: "Iluminação portátil" }],
      "iluminacao",
      "Todas",
    ),
  ).toHaveLength(1);
});

test("categoria e pesquisa se combinam", () => {
  expect(
    filterProducts(snapshotA.products, "tesoura", "Iluminação"),
  ).toHaveLength(0);
  expect(filterProducts(snapshotA.products, "", "Cozinha")).toHaveLength(1);
});
