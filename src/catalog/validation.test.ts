import { test, expect } from "vitest";

test("caminhos aceitam WebP comercial e de demo, mantendo JPEG e rejeitando executáveis", async () => {
  const { isImagePath, isRemoteImagePath } = await import("./validation");
  for (const ext of ["jpg", "webp"]) {
    expect(
      isRemoteImagePath(`products/00000000-0000-0000-0000-000000000001.${ext}`),
    ).toBe(true);
    expect(isImagePath(`photos/panela.${ext}`)).toBe(true);
  }
  expect(isImagePath("photos/x.svg")).toBe(false);
  expect(isRemoteImagePath("products/x.webp")).toBe(false);
});
