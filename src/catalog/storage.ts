import type { CatalogSnapshot, LocalCatalog } from "./types";

import Dexie, { type Table } from "dexie";

import { parseSnapshot } from "./validation";

export type CatalogStore = {
  readActive(): Promise<LocalCatalog | null>;
  readPhoto(path: string): Promise<Blob | undefined>;
  stagePhoto(operationId: string, path: string, blob: Blob): Promise<void>;
  activate(
    operationId: string,
    snapshot: CatalogSnapshot,
    now: string,
  ): Promise<void>;
  markChecked(now: string): Promise<void>;
  discardOperation(operationId: string): Promise<void>;
  clearAbandonedStaging(): Promise<void>;
  prune(): Promise<void>;
  close(): void;
};

type Row = {
  id: "active";
  snapshot: CatalogSnapshot;
  activatedAt: string;
  checkedAt: string;
};

type Photo = { path: string; blob: Blob };

type StagedPhoto = Photo & { operationId: string };

export function createCatalogStore(name: string): CatalogStore {
  const db = new Dexie(name);
  db.version(1).stores({
    catalog: "id",
    photos: "path",
    stagedPhotos: "[operationId+path], operationId",
  });
  const catalog: Table<Row, string> = db.table("catalog");
  const photos: Table<Photo, string> = db.table("photos");
  const staged: Table<StagedPhoto, [string, string]> = db.table("stagedPhotos");

  return {
    readActive: () =>
      db.transaction("r", catalog, photos, async () => {
        const row = await catalog.get("active");

        if (!row) return null;

        const result = new Map<string, Blob>();

        for (const p of row.snapshot.products) {
          const photo = await photos.get(p.imagePath);

          if (!photo)
            throw new Error(
              "Catálogo local incompleto. Prepare novamente com internet.",
            );

          result.set(p.imagePath, photo.blob);
        }

        return {
          snapshot: row.snapshot,
          checkedAt: row.checkedAt,
          activatedAt: row.activatedAt,
          photos: result,
        };
      }),
    readPhoto: async (path) => (await photos.get(path))?.blob,
    stagePhoto: async (operationId, path, blob) => {
      await staged.put({ operationId, path, blob });
    },
    activate: async (operationId, input, now) => {
      const snapshot = parseSnapshot(input);
      await db.transaction("rw", catalog, photos, staged, async () => {
        for (const p of snapshot.products) {
          if (await photos.get(p.imagePath)) continue;

          const photo = await staged.get([operationId, p.imagePath]);

          if (!photo) throw new Error("Foto obrigatória ausente");

          await photos.put({ path: photo.path, blob: photo.blob });
        }

        await catalog.put({
          id: "active",
          snapshot,
          activatedAt: now,
          checkedAt: now,
        });
        await staged.where("operationId").equals(operationId).delete();
      });
    },
    markChecked: async (now) => {
      await catalog.update("active", { checkedAt: now });
    },
    discardOperation: async (operationId) => {
      await staged.where("operationId").equals(operationId).delete();
    },
    // Caller must hold the origin-wide sync lock, before starting a new operation.
    clearAbandonedStaging: async () => {
      await staged.clear();
    },
    prune: () =>
      db.transaction("rw", catalog, photos, async () => {
        const row = await catalog.get("active");
        const activePaths = new Set(
          row?.snapshot.products.map((p) => p.imagePath) ?? [],
        );
        await photos.filter((p) => !activePaths.has(p.path)).delete();
      }),
    close: () => db.close(),
  };
}

export function createPublicCatalogStore(
  source: "demo" | "supabase",
  url?: string,
): CatalogStore {
  // Keep legacy demo copies intact. Revisions are meaningful only within a source.
  const name =
    source === "demo"
      ? "catalogo-offline"
      : `catalogo-offline:supabase:${new URL(url!).origin}`;
  return createCatalogStore(name);
}
