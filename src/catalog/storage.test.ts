import { afterEach, expect, test, vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import { IDBObjectStore } from "fake-indexeddb";

import { createCatalogStore, type CatalogStore } from "./storage";
import { snapshotA, snapshotB } from "../test/fixtures";

vi.stubGlobal("Blob", NodeBlob);

const stores: CatalogStore[] = [];

function store(name = crypto.randomUUID()) {
  const s = createCatalogStore(name);
  stores.push(s);

  return s;
}

async function stage(s: CatalogStore, op: string, paths: string[]) {
  for (const path of paths)
    await s.stagePhoto(
      op,
      path,
      new Blob(["photo bytes"], { type: "image/jpeg" }),
    );
}

async function seed(s: CatalogStore) {
  await stage(
    s,
    "a",
    snapshotA.products.map((p) => p.imagePath),
  );
  await s.activate("a", snapshotA, "2026-10-14T12:00:00.000Z");
}

afterEach(() => {
  stores.forEach((s) => s.close());
  stores.length = 0;
  vi.restoreAllMocks();
});

test("reabrir recupera produtos e bytes das fotos", async () => {
  const name = crypto.randomUUID();
  const first = store(name);
  await seed(first);
  first.close();
  const restored = await store(name).readActive();
  expect(restored?.snapshot.products).toHaveLength(10);
  expect(await restored?.photos.get("photos/p0.jpg")?.text()).toBe(
    "photo bytes",
  );
});

test("foto ausente impede substituir catálogo válido", async () => {
  const s = store();
  await seed(s);
  await expect(
    s.activate("b", snapshotB, "2026-10-14T13:00:00.000Z"),
  ).rejects.toThrow();
  expect((await s.readActive())?.snapshot.revision).toBe(1);
});

test("quota durante ativação reverte foto e snapshot juntos", async () => {
  const s = store();
  await seed(s);
  await stage(s, "b", ["photos/p0-v2.jpg"]);
  const original = IDBObjectStore.prototype.put;
  const spy = vi
    .spyOn(IDBObjectStore.prototype, "put")
    .mockImplementation(function (this: IDBObjectStore, ...args) {
      if (this.name === "catalog")
        throw new DOMException("No space", "QuotaExceededError");

      return original.apply(this, args);
    });
  await expect(
    s.activate("b", snapshotB, "2026-10-14T13:00:00.000Z"),
  ).rejects.toThrow();
  spy.mockRestore();
  expect((await s.readActive())?.snapshot.revision).toBe(1);
  expect(await s.readPhoto("photos/p0-v2.jpg")).toBeUndefined();
});

test("preparação interrompida mantém versão anterior", async () => {
  const s = store();
  await seed(s);
  await stage(s, "b", ["photos/p0-v2.jpg"]);
  await s.discardOperation("b");
  expect((await s.readActive())?.snapshot.products).toHaveLength(10);
});

test("snapshot vazio oculta todos e limpeza preserva blobs já lidos", async () => {
  const s = store();
  await seed(s);
  const before = await s.readActive();
  await s.activate(
    "b",
    { ...snapshotB, products: [] },
    "2026-10-14T13:00:00.000Z",
  );
  await s.prune();
  expect((await s.readActive())?.snapshot.products).toHaveLength(0);
  expect(await s.readPhoto("photos/p0.jpg")).toBeUndefined();
  expect(await before?.photos.get("photos/p0.jpg")?.text()).toBe("photo bytes");
});

test("descartar uma operação não apaga outra em preparação", async () => {
  const s = store();
  await stage(s, "a", ["photos/p0.jpg"]);
  await s.discardOperation("b");
  await s.activate(
    "a",
    { ...snapshotA, products: [snapshotA.products[0]] },
    "2026-10-14T12:00:00.000Z",
  );
  expect((await s.readActive())?.snapshot.products).toHaveLength(1);
});
