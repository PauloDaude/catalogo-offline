import { afterEach, beforeEach, expect, test } from "vitest";

import { syncCatalog } from "./sync";
import { createCatalogStore, type CatalogStore } from "./storage";
import { snapshotA, snapshotB } from "../test/fixtures";
import { installBrowserFakes, makeSource } from "../test/sync-fixtures";
import { jpeg } from "../test/sync-fixtures";

import Dexie from "dexie";

const now = () => "2026-10-14T14:00:00.000Z";

let store: CatalogStore;

beforeEach(() => {
  installBrowserFakes();
  store = createCatalogStore(crypto.randomUUID());
});

afterEach(() => store.close());

test("nova tentativa limpa fotos abandonadas após encerramento abrupto", async () => {
  const name = crypto.randomUUID();
  store.close();
  store = createCatalogStore(name);
  await store.stagePhoto("crashed-operation", "photos/abandoned.jpg", jpeg());
  store.close();
  store = createCatalogStore(name);
  await syncCatalog(makeSource(snapshotA), store, { now });
  const inspection = new Dexie(name);
  await inspection.open();

  try {
    expect(await inspection.table("stagedPhotos").count()).toBe(0);
    expect((await store.readActive())?.photos.size).toBe(10);
  } finally {
    inspection.close();
  }
});

test("ativa preço, foto e ocultação juntos", async () => {
  await syncCatalog(makeSource(snapshotA), store, { now });
  await syncCatalog(makeSource(snapshotB), store, { now });
  const active = await store.readActive();
  expect(active?.snapshot.revision).toBe(2);
  expect(active?.snapshot.products).toHaveLength(9);
  expect(active?.snapshot.products[0].priceCents).toBe(3000);
  expect(active?.photos.has("photos/p0-v2.jpg")).toBe(true);
});

test("revisão igual não faz download", async () => {
  await syncCatalog(makeSource(snapshotA), store, { now });
  const source = makeSource(snapshotA);
  source.getPhoto = async () => {
    throw new Error("unexpected download");
  };
  expect((await syncCatalog(source, store, { now })).status).toBe("unchanged");
  expect((await store.readActive())?.checkedAt).toBe(
    "2026-10-14T14:00:00.000Z",
  );
});

test.each(["http", "quota", "cancel", "html"])(
  "falha %s preserva versão anterior",
  async (failure) => {
    await syncCatalog(makeSource(snapshotA), store, { now });
    const source = makeSource(snapshotB);
    const controller = new AbortController();
    source.getPhoto = async () => {
      if (failure === "html")
        return new Blob(["<html>"], { type: "image/jpeg" });

      if (failure === "cancel") controller.abort();

      throw new DOMException(
        "failure",
        failure === "quota" ? "QuotaExceededError" : "NetworkError",
      );
    };
    await expect(
      syncCatalog(source, store, { now, signal: controller.signal }),
    ).rejects.toThrow();
    expect((await store.readActive())?.snapshot.revision).toBe(1);
  },
);

test("revisão muda durante download e só snapshot estável ativa", async () => {
  const source = makeSource(snapshotA);
  let reads = 0;
  source.getSnapshot = async () => (++reads === 1 ? snapshotA : snapshotB);
  source.getRevision = async () => 2;
  await syncCatalog(source, store, { now });
  expect((await store.readActive())?.snapshot.revision).toBe(2);
});

test("revisão instável termina em três tentativas sem ativar", async () => {
  const source = makeSource(snapshotA);
  let reads = 0;
  source.getSnapshot = async () => {
    reads++;

    return snapshotA;
  };
  source.getRevision = async () => 2;
  await expect(syncCatalog(source, store, { now })).rejects.toThrow();
  expect(reads).toBe(3);
  expect(await store.readActive()).toBeNull();
});

test("duas operações resultam em uma revisão completa", async () => {
  await Promise.all([
    syncCatalog(makeSource(snapshotA), store, { now }),
    syncCatalog(makeSource(snapshotB), store, { now }),
  ]);
  expect((await store.readActive())?.snapshot.revision).toBe(2);
  expect((await store.readActive())?.photos.size).toBe(9);
});

test("erro na limpeza após ativação não desfaz sucesso", async () => {
  store.prune = async () => {
    throw new Error("cleanup");
  };
  expect(
    (await syncCatalog(makeSource(snapshotA), store, { now })).status,
  ).toBe("updated");
  expect((await store.readActive())?.snapshot.revision).toBe(1);
});
