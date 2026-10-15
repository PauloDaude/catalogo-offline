import type { CatalogSource } from "./types";
import { parseSnapshot } from "./validation";
export function createHttpSource(baseUrl: string): CatalogSource {
  const prefix = `${baseUrl.replace(/\/$/, "")}/demo/`;
  const request = async (path: string, signal?: AbortSignal) => {
    const response = await fetch(`${prefix}${path}`, {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(30_000)])
        : AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Não foi possível consultar o catálogo");
    return response;
  };
  const getSnapshot = async (signal?: AbortSignal) =>
    parseSnapshot(await (await request("catalog.json", signal)).json());
  return {
    getSnapshot,
    getRevision: async (signal) => (await getSnapshot(signal)).revision,
    getPhoto: async (path, signal) => {
      if (!/^photos\/[a-zA-Z0-9_-]+\.jpg$/.test(path))
        throw new Error("Caminho inválido");
      return (await request(path, signal)).blob();
    },
  };
}
