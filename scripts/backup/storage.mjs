import { createClient } from "@supabase/supabase-js";
import { BackupError } from "./config.mjs";

export function createStorage(config) {
  const client = createClient(config.apiUrl, config.storageKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options) =>
        fetch(url, { ...options, signal: AbortSignal.timeout(60000) }),
    },
  });
  return {
    check: async () => {
      const { error } = await client.storage.getBucket("product-photos");
      if (error)
        throw new BackupError(
          "Não foi possível acessar o bucket com a credencial de backup",
        );
    },
    download: async (name) => {
      const { data, error } = await client.storage
        .from("product-photos")
        .download(name);
      if (error || !data)
        throw new BackupError(
          "Não foi possível baixar uma foto, confira a conexão e repita o backup",
        );
      return data;
    },
  };
}
