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

test("prepara WebP real com limite de tamanho e sem ampliar", async () => {
  const close = vi.fn();
  let dimensions: number[] = [];
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ width: 2000, height: 1000, close }),
  );
  const context = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D);
  const encode = vi
    .spyOn(HTMLCanvasElement.prototype, "toBlob")
    .mockImplementation(function (this: HTMLCanvasElement, callback, type) {
      dimensions = [this.width, this.height];
      callback(new Blob(["photo"], { type: type! }));
    });
  try {
    const blob = await optimizePhoto(
      new File(["photo"], "a.jpg", { type: "image/jpeg" }),
    );
    expect(blob.type).toBe("image/webp");
    expect(blob.size).toBeLessThanOrEqual(500000);
    expect(dimensions).toEqual([1600, 800]);
    expect(close).toHaveBeenCalledOnce();
  } finally {
    context.mockRestore();
    encode.mockRestore();
    vi.unstubAllGlobals();
  }
});

test("não usa extensão WebP se o canvas retornar PNG como fallback", async () => {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn().mockResolvedValue({ width: 10, height: 10, close: vi.fn() }),
  );
  const context = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D);
  const encode = vi
    .spyOn(HTMLCanvasElement.prototype, "toBlob")
    .mockImplementation((callback) =>
      callback(new Blob(["png"], { type: "image/png" })),
    );
  try {
    await expect(
      optimizePhoto(new File(["photo"], "a.jpg", { type: "image/jpeg" })),
    ).rejects.toThrow(/WebP/);
  } finally {
    context.mockRestore();
    encode.mockRestore();
    vi.unstubAllGlobals();
  }
});
