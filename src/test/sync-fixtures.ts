import { vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import type { CatalogSnapshot, CatalogSource } from "../catalog/types";
export function installBrowserFakes() {
  vi.stubGlobal("Blob", NodeBlob);
  vi.stubGlobal("createImageBitmap", async () => ({
    width: 10,
    height: 10,
    close() {},
  }));
  let tail: Promise<unknown> = Promise.resolve();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (
        _name: string,
        options: { signal?: AbortSignal },
        work: () => unknown,
      ) => {
        const job = tail.then(() => {
          options.signal?.throwIfAborted();
          return work();
        });
        tail = job.catch(() => {});
        return job;
      },
    },
  });
}
export const jpeg = () =>
  new Blob([new Uint8Array([255, 216, 255, 219, 0, 1])], {
    type: "image/jpeg",
  });
export function makeSource(snapshot: CatalogSnapshot): CatalogSource {
  return {
    getSnapshot: async () => snapshot,
    getRevision: async () => snapshot.revision,
    getPhoto: async () => jpeg(),
  };
}
