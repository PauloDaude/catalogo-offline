import type { SupabaseClient } from "@supabase/supabase-js";

import type { CatalogSource } from "./types";
import { isRemoteImagePath, parseSnapshot } from "./validation";
import { validatePhoto } from "./image-download";

export function createSupabaseSource(client: SupabaseClient): CatalogSource {
  const photoUrl = (path: string) => {
    if (!isRemoteImagePath(path)) throw new Error("Caminho de foto inválido.");

    return client.storage.from("product-photos").getPublicUrl(path).data
      .publicUrl;
  };
  const getSnapshot = async (signal?: AbortSignal) => {
    const timeout = AbortSignal.timeout(30_000);
    const { data, error } = await client
      .rpc("read_catalog_snapshot")
      .abortSignal(signal ? AbortSignal.any([signal, timeout]) : timeout);

    if (error)
      throw new Error(
        "Não foi possível consultar o catálogo. Tente novamente.",
      );

    return parseSnapshot(data);
  };

  return {
    getSnapshot,
    getRevision: async (signal) => (await getSnapshot(signal)).revision,
    photoUrl,
    getPhoto: async (path, signal) => {
      const response = await fetch(photoUrl(path), {
        cache: "no-store",
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(30_000)])
          : AbortSignal.timeout(30_000),
      });

      if (!response.ok) throw new Error("Não foi possível baixar a foto.");

      const blob = await response.blob();
      await validatePhoto(blob);

      return blob;
    },
  };
}
