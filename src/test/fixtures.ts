import type { CatalogSnapshot } from "../catalog/types";

export const snapshotA: CatalogSnapshot = {
  revision: 1,
  updatedAt: "2026-10-14T12:00:00.000Z",
  products: Array.from({ length: 10 }, (_, i) => ({
    id: `p${i}`,
    code: `P${String(i + 1).padStart(3, "0")}`,
    name: i === 0 ? "Tesoura de cozinha" : `Lanterna ${i}`,
    priceCents: 2500,
    category: i === 0 ? "Cozinha" : "Iluminação",
    imagePath: `photos/p${i}.jpg`,
  })),
};

export const snapshotB: CatalogSnapshot = {
  revision: 2,
  updatedAt: "2026-10-14T13:00:00.000Z",
  products: snapshotA.products
    .slice(0, 9)
    .map((p, i) =>
      i === 0 ? { ...p, priceCents: 3000, imagePath: "photos/p0-v2.jpg" } : p,
    ),
};
