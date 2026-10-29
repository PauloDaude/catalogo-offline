import { beforeEach, expect, test, vi } from "vitest";

import { installBrowserFakes, jpeg } from "../test/sync-fixtures";
import { validatePhoto } from "./image-download";

beforeEach(installBrowserFakes);

test("aceita JPEG decodificável", async () => {
  await expect(validatePhoto(jpeg())).resolves.toBeUndefined();
});

test("rejeita HTML mesmo rotulado como JPEG", async () => {
  await expect(
    validatePhoto(new Blob(["<html>"], { type: "image/jpeg" })),
  ).rejects.toThrow();
});

test("rejeita MIME incorreto", async () => {
  await expect(
    validatePhoto(new Blob(["x"], { type: "text/html" })),
  ).rejects.toThrow();
});

test("rejeita JPEG com decodificação inválida", async () => {
  vi.stubGlobal("createImageBitmap", async () => {
    throw new Error("broken");
  });
  await expect(validatePhoto(jpeg())).rejects.toThrow();
});

const webp = () =>
  new Blob([new Uint8Array([82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80])], {
    type: "image/webp",
  });
test("aceita assinatura WebP decodificável", async () => {
  await expect(validatePhoto(webp())).resolves.toBeUndefined();
});
test("rejeita PNG ou outro RIFF rotulado como WebP", async () => {
  for (const bytes of [
    new Uint8Array([137, 80, 78, 71]),
    new Uint8Array([82, 73, 70, 70, 4, 0, 0, 0, 65, 86, 73, 32]),
  ])
    await expect(
      validatePhoto(new Blob([bytes], { type: "image/webp" })),
    ).rejects.toThrow();
});
test("WebP com assinatura correta ainda exige decodificação válida", async () => {
  vi.stubGlobal("createImageBitmap", async () => {
    throw new Error("broken");
  });
  await expect(validatePhoto(webp())).rejects.toThrow();
});
