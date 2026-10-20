import { expect, test, vi } from "vitest";
import { createSupabaseSource } from "./supabase-source";
import type { SupabaseClient } from "@supabase/supabase-js";

test("snapshot validado e fotos limitadas ao bucket comercial", async () => {
  const snapshot = {
    revision: 2,
    updatedAt: "2026-10-20T10:00:00Z",
    products: [],
  };
  const client = {
    rpc: vi.fn().mockReturnValue({
      abortSignal: () => Promise.resolve({ data: snapshot, error: null }),
    }),
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `https://example.supabase.co/storage/v1/object/public/product-photos/${path}`,
          },
        }),
      }),
    },
  } as unknown as SupabaseClient;
  const source = createSupabaseSource(client);
  expect(await source.getSnapshot()).toEqual(snapshot);
  expect(
    source.photoUrl?.("products/00000000-0000-0000-0000-000000000001.jpg"),
  ).toContain("/product-photos/products/");
  await expect(source.getPhoto("https://evil.test/a.jpg")).rejects.toThrow();
});
