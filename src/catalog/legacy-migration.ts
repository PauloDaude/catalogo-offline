import Dexie from "dexie";
import type { CatalogStore } from "./storage";
import { createCatalogStore } from "./storage";
import type { LocalCatalog } from "./types";
const pending = new Map<string, Promise<LocalCatalog | null>>();
export function migrateLegacyCatalogOnce(
  name: string,
  target: CatalogStore,
  read: () => Promise<LocalCatalog | null>,
): Promise<LocalCatalog | null> {
  if (pending.has(name)) return pending.get(name)!;
  const migrate = (async () => {
    if (!(await Dexie.exists(name))) return null;
    const old = createCatalogStore(name);
    try {
      const copy = await old.readActive();
      if (!copy) return null;
      const operation = `legacy-${crypto.randomUUID()}`;
      try {
        for (const [path, blob] of copy.photos)
          await target.stagePhoto(operation, path, blob);
        await target.activate(operation, copy.snapshot, copy.activatedAt, {
          onlyIfEmpty: true,
          checkedAt: copy.checkedAt,
        });
        return read();
      } catch (error) {
        await target.discardOperation(operation).catch(() => {});
        throw error;
      }
    } finally {
      old.close();
    }
  })();
  pending.set(name, migrate);
  void migrate.finally(() => pending.delete(name)).catch(() => {});
  return migrate;
}
