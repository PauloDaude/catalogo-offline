import { expect, test } from "vitest";
import { parseSupabaseConfig } from "./supabase";
test("somente URL segura e chave pública entram no cliente", () => {
  expect(
    parseSupabaseConfig("https://example.supabase.co", "sb_publishable_demo")
      .url,
  ).toBe("https://example.supabase.co");
  for (const [url, key] of [
    ["http://evil.test", "sb_publishable_x"],
    ["https://a.co", "sb_secret_x"],
    ["", ""],
  ])
    expect(() => parseSupabaseConfig(url, key)).toThrow();
});
