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

test("rejeita ids duplicados e categoria vazia", () => {
  expect(() =>
    parseSnapshot({
      ...snapshotA,
      products: [snapshotA.products[0], snapshotA.products[0]],
    }),
  ).toThrow();
  expect(() =>
    parseSnapshot({
      ...snapshotA,
      products: [{ ...snapshotA.products[0], category: "" }],
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

test("mantém código curto único e estável após reordenar produtos", () => {
  const products = snapshotA.products.map((product, index) => ({
    ...product,
    code: `P${String(index + 1).padStart(3, "0")}`,
  }));
  const result = parseSnapshot({
    ...snapshotA,
    products: [...products].reverse(),
  });
  expect(result.products.find((product) => product.id === "p0")?.code).toBe(
    "P001",
  );
  expect(result.products[0].code).toBe("P010");
});

test("rejeita códigos curtos duplicados ou fora do padrão", () => {
  expect(() =>
    parseSnapshot({
      ...snapshotA,
      products: [
        { ...snapshotA.products[0], code: "P001" },
        { ...snapshotA.products[1], code: "P001" },
      ],
    }),
  ).toThrow();
  expect(() =>
    parseSnapshot({
      ...snapshotA,
      products: [{ ...snapshotA.products[0], code: "um-codigo-muito-longo" }],
    }),
  ).toThrow();
});

test("preserva preço anterior opcional para ofertas", () => {
  const result = parseSnapshot({
    ...snapshotA,
    products: [{ ...snapshotA.products[0], previousPriceCents: 4000 }],
  });

  expect(result.products[0]).toHaveProperty("previousPriceCents", 4000);
});

test.each([
  null,
  "4000",
  -1,
  2500,
  2000,
  4000.5,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1,
])(
  "rejeita preço anterior inválido ou sem desconto: %s",
  (previousPriceCents) => {
    expect(() =>
      parseSnapshot({
        ...snapshotA,
        products: [{ ...snapshotA.products[0], previousPriceCents }],
      }),
    ).toThrow();
  },
);

test("baixa WebP e JPEG da demo pelo mesmo guard do parser", async () => {
  const fetchPhoto = vi.fn(
    async (url: string) =>
      new Response("photo", {
        headers: {
          "content-type": url.endsWith(".webp") ? "image/webp" : "image/jpeg",
        },
      }),
  );
  vi.stubGlobal("fetch", fetchPhoto);
  const source = createHttpSource("/catalogo/");
  for (const ext of ["jpg", "webp"])
    expect((await source.getPhoto(`photos/panela.${ext}`)).type).toBe(
      ext === "webp" ? "image/webp" : "image/jpeg",
    );
  for (const path of [
    "../private.webp",
    "https://evil.test/x.webp",
    "products/00000000-0000-0000-0000-000000000001.webp",
  ])
    await expect(source.getPhoto(path)).rejects.toThrow();
  expect(fetchPhoto).toHaveBeenCalledTimes(2);
});
