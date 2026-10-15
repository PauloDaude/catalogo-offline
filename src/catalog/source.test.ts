import { afterEach, expect, test, vi } from "vitest";

import { parseSnapshot } from "./validation";
import { createHttpSource } from "./source";
import { snapshotA } from "../test/fixtures";

afterEach(() => vi.unstubAllGlobals());

test("aceita snapshot público válido", () =>
  expect(parseSnapshot(snapshotA).products).toHaveLength(10));

test.each([-1, 1.5, Infinity])("rejeita preço inválido %s", (priceCents) => {
  expect(() =>
    parseSnapshot({
      ...snapshotA,
      products: [{ ...snapshotA.products[0], priceCents }],
    }),
  ).toThrow();
});

test("rejeita ids duplicados e categoria desconhecida", () => {
  expect(() =>
    parseSnapshot({
      ...snapshotA,
      products: [snapshotA.products[0], snapshotA.products[0]],
    }),
  ).toThrow();
  expect(() =>
    parseSnapshot({
      ...snapshotA,
      products: [{ ...snapshotA.products[0], category: "X" }],
    }),
  ).toThrow();
});

test("fonte respeita subdiretório e rejeita JSON inválido", async () => {
  vi.stubGlobal("fetch", async (url: string) =>
    url === "/catalogo/demo/catalog.json"
      ? new Response(JSON.stringify(snapshotA))
      : new Response("invalid"),
  );
  expect((await createHttpSource("/catalogo/").getSnapshot()).revision).toBe(1);
  await expect(createHttpSource("/errado/").getSnapshot()).rejects.toThrow();
});

test("rejeita caminho externo e protocolo perigoso", () => {
  for (const imagePath of [
    "https://evil.test/a.jpg",
    "//evil.test/a.jpg",
    "../private.jpg",
    "javascript:alert(1)",
  ])
    expect(() =>
      parseSnapshot({
        ...snapshotA,
        products: [{ ...snapshotA.products[0], imagePath }],
      }),
    ).toThrow();
});
