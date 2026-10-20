import { test, expect } from "vitest";
import { createPublicCatalogStore } from "./storage";
import { snapshotA } from "../test/fixtures";

test("demo e projetos Supabase mantêm cópias independentes mesmo com revisão igual", async () => {
  const demo = createPublicCatalogStore("demo");
  const remote = createPublicCatalogStore(
    "supabase",
    "https://one.supabase.co",
  );
  const other = createPublicCatalogStore("supabase", "https://two.supabase.co");
  try {
    const saved = {
      ...snapshotA,
      revision: 3,
      products: [snapshotA.products[0]],
    };
    await demo.stagePhoto(
      "demo",
      saved.products[0].imagePath,
      new Blob(["photo"], { type: "image/jpeg" }),
    );
    await demo.activate("demo", saved, new Date().toISOString());
    expect(await remote.readActive()).toBeNull();
    await remote.activate(
      "remote",
      { ...saved, products: [] },
      new Date().toISOString(),
    );
    expect((await demo.readActive())?.snapshot.products).toHaveLength(1);
    expect((await remote.readActive())?.snapshot.products).toHaveLength(0);
    expect(await other.readActive()).toBeNull();
  } finally {
    demo.close();
    remote.close();
    other.close();
  }
});
