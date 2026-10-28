import "fake-indexeddb/auto";
import { expect, test } from "vitest";
import Dexie from "dexie";
import { createCatalogStore, createPublicCatalogStore } from "./storage";
import { snapshotA } from "../test/fixtures";
test("V2 copia catálogo V1 uma vez e não compartilha poda com aba antiga", async () => {
  const legacy = createCatalogStore("catalogo-offline");
  for (const p of snapshotA.products)
    await legacy.stagePhoto("old", p.imagePath, new Blob(["photo"]));
  await legacy.activate("old", snapshotA, "2026-10-28T00:00:00Z");
  const newer = createPublicCatalogStore("demo");
  expect((await newer.readActive())?.snapshot.products).toHaveLength(
    snapshotA.products.length,
  );
  await legacy.activate(
    "empty",
    { ...snapshotA, revision: 9, products: [] },
    "2026-10-28T00:00:00Z",
  );
  await legacy.prune();
  expect((await newer.readActive())?.photos.size).toBeGreaterThan(0);
  await newer.activate(
    "new-empty",
    { ...snapshotA, revision: 10, products: [] },
    "2026-10-28T00:00:00Z",
  );
  expect((await newer.readActive())?.snapshot.products).toEqual([]);
  newer.close();
  legacy.close();
  await Dexie.delete("catalogo-offline");
  await Dexie.delete("catalogo-offline:v2");
});

test("cópia V1 atrasada não sobrescreve snapshot novo ativado por outra aba", async () => {
  const legacyName = "legacy-race-test",
    targetName = "target-race-test";
  const old = createCatalogStore(legacyName),
    target = createCatalogStore(targetName);
  for (const p of snapshotA.products)
    await old.stagePhoto("old", p.imagePath, new Blob(["photo"]));
  await old.activate("old", snapshotA, "2026-10-28T00:00:00Z");
  const realStage = target.stagePhoto;
  let release: () => void = () => {};
  let entered: () => void = () => {};
  const started = new Promise<void>((r) => (entered = r)),
    gate = new Promise<void>((r) => (release = r));
  let first = true;
  target.stagePhoto = async (...args) => {
    if (first) {
      first = false;
      entered();
      await gate;
    }
    return realStage(...args);
  };
  const { migrateLegacyCatalogOnce } = await import("./legacy-migration");
  const copying = migrateLegacyCatalogOnce(
    legacyName,
    target,
    target.readActive,
  );
  await started;
  await target.activate(
    "new",
    { schemaVersion: 2, ...snapshotA, revision: 99, products: [] },
    "2026-10-28T01:00:00Z",
  );
  release();
  await copying;
  expect((await target.readActive())?.snapshot.revision).toBe(99);
  expect((await target.readActive())?.snapshot.schemaVersion).toBe(2);
  old.close();
  target.close();
  await Dexie.delete(legacyName);
  await Dexie.delete(targetName);
});
