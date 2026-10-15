import type { CatalogSource, SyncProgress, SyncResult } from "./types";
import type { CatalogStore } from "./storage";
import { withSyncLock } from "./sync-lock";
import { validatePhoto } from "./image-download";
import { parseSnapshot } from "./validation";
export type SyncOptions = {
  now: () => string;
  signal?: AbortSignal;
  onProgress?: (value: SyncProgress) => void;
};
export async function syncCatalog(
  source: CatalogSource,
  store: CatalogStore,
  options: SyncOptions,
): Promise<SyncResult> {
  return withSyncLock(async () => {
    // No other download can be active while this lock is held. Previous owners
    // that closed abruptly cannot execute their finally/catch cleanup.
    await store.clearAbandonedStaging();
    for (let attempt = 0; attempt < 3; attempt++) {
      options.signal?.throwIfAborted();
      options.onProgress?.({ phase: "checking", completed: 0, total: 0 });
      const snapshot = parseSnapshot(await source.getSnapshot(options.signal));
      const local = await store.readActive();
      if (local?.snapshot.revision === snapshot.revision) {
        await store.markChecked(options.now());
        return { status: "unchanged", revision: snapshot.revision };
      }
      const operation = crypto.randomUUID();
      const controller = new AbortController();
      const signal = options.signal
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal;
      try {
        const paths = [...new Set(snapshot.products.map((p) => p.imagePath))];
        let completed = 0;
        let cursor = 0;
        const results = await Promise.allSettled(
          Array.from({ length: Math.min(3, paths.length) }, async () => {
            try {
              while (cursor < paths.length) {
                signal.throwIfAborted();
                const path = paths[cursor++];
                if (!(await store.readPhoto(path))) {
                  const blob = await source.getPhoto(path, signal);
                  await validatePhoto(blob);
                  signal.throwIfAborted();
                  await store.stagePhoto(operation, path, blob);
                }
                options.onProgress?.({
                  phase: "downloading",
                  completed: ++completed,
                  total: paths.length,
                });
              }
            } catch (error) {
              controller.abort(error);
              throw error;
            }
          }),
        );
        const failed = results.find((r) => r.status === "rejected");
        if (failed?.status === "rejected") throw failed.reason;
        signal.throwIfAborted();
        if ((await source.getRevision(signal)) !== snapshot.revision) {
          await store.discardOperation(operation);
          continue;
        }
        signal.throwIfAborted();
        options.onProgress?.({
          phase: "activating",
          completed: paths.length,
          total: paths.length,
        });
        await store.activate(operation, snapshot, options.now());
        await store.prune().catch(() => {});
        return { status: "updated", revision: snapshot.revision };
      } catch (error) {
        await store.discardOperation(operation).catch(() => {});
        throw error;
      }
    }
    throw new Error(
      "O catálogo está sendo alterado. Tente atualizar novamente.",
    );
  }, options.signal);
}
