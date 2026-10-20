import { expect, test } from "vitest";

import { filterProducts } from "./search";
import { snapshotA } from "../test/fixtures";

test("pesquisa ignora caixa e espaços", () => {
  expect(
    filterProducts(snapshotA.products, "  TESOURA  ", null).map((p) => p.id),
  ).toEqual(["p0"]);
});

test("pesquisa ignora acentos", () => {
  expect(
    filterProducts(
      [{ ...snapshotA.products[0], name: "Iluminação portátil" }],
      "iluminacao",
      null,
    ),
  ).toHaveLength(1);
});

test("categoria e pesquisa se combinam", () => {
  expect(
    filterProducts(snapshotA.products, "tesoura", "Iluminação"),
  ).toHaveLength(0);
  expect(filterProducts(snapshotA.products, "", "Cozinha")).toHaveLength(1);
});

test("categoria chamada Todas pode ser filtrada sem significar filtro geral", () => {
  expect(
    filterProducts(
      [{ ...snapshotA.products[0], category: "Todas" }, snapshotA.products[1]],
      "",
      "Todas",
    ),
  ).toHaveLength(1);
});
