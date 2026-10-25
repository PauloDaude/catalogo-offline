import { beforeEach, expect, test, vi } from "vitest";
const mock = vi.hoisted(() => ({ getDocument: vi.fn() }));
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: mock.getDocument,
}));
import { renderOrderPreview } from "./preview";
const file = { arrayBuffer: async () => new ArrayBuffer(8) } as File;
beforeEach(() => vi.restoreAllMocks());
test("renderiza somente primeira página em resolução limitada e libera documento", async () => {
  const cleanup = vi.fn(),
    destroy = vi.fn(async () => {}),
    render = vi.fn(() => ({ promise: Promise.resolve() }));
  const getPage = vi.fn(async () => ({
    getViewport: ({ scale }: { scale: number }) => ({
      width: 595 * scale,
      height: 842 * scale,
    }),
    render,
    cleanup,
  }));
  mock.getDocument.mockReturnValue({
    promise: Promise.resolve({ getPage }),
    destroy,
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    {} as never,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) => callback(new Blob(["preview"], { type: "image/png" })),
  );
  const blob = await renderOrderPreview(file);
  expect(blob.type).toBe("image/png");
  expect(getPage).toHaveBeenCalledExactlyOnceWith(1);
  expect(render).toHaveBeenCalledOnce();
  expect(cleanup).toHaveBeenCalledOnce();
  expect(destroy).toHaveBeenCalledOnce();
});
test("falha de parse libera worker e propaga falha para fallback", async () => {
  const destroy = vi.fn(async () => {});
  mock.getDocument.mockReturnValue({
    promise: Promise.reject(new Error("PDF inválido")),
    destroy,
  });
  await expect(renderOrderPreview(file)).rejects.toThrow("PDF inválido");
  expect(destroy).toHaveBeenCalledOnce();
});
