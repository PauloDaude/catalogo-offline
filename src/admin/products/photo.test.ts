import { test, expect, vi } from "vitest";
import { optimizePhoto } from "./photo";
test("foto inválida não é decodificada nem enviada", async () => {
  const decode = vi.fn();
  vi.stubGlobal("createImageBitmap", decode);
  await expect(
    optimizePhoto(new File(["<svg/>"], "bad.svg", { type: "image/svg+xml" })),
  ).rejects.toThrow();
  expect(decode).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
