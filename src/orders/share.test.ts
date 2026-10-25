import { afterEach, expect, test, vi } from "vitest";
import { canShareOrder, downloadOrder, shareOrder } from "./share";
const file = new File(["pdf"], "pedido.pdf", { type: "application/pdf" });
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
test("sem suporte de arquivos não oferece share", () => {
  vi.stubGlobal("navigator", {});
  expect(canShareOrder(file)).toBe(false);
  vi.stubGlobal("navigator", { share: vi.fn(), canShare: () => false });
  expect(canShareOrder(file)).toBe(false);
  vi.stubGlobal("navigator", {
    share: vi.fn(),
    canShare: () => {
      throw Error();
    },
  });
  expect(canShareOrder(file)).toBe(false);
});
test("compartilha o arquivo pronto em tentativas sequenciais", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { share, canShare: () => true });
  expect(canShareOrder(file)).toBe(true);
  expect(await shareOrder(file)).toBe("shared");
  expect(await shareOrder(file)).toBe("shared");
  expect(share).toHaveBeenCalledWith({
    files: [file],
    title: "Pedido Cirandinha",
  });
});
test("cancelar não é erro mas falha real é propagada", async () => {
  const share = vi
    .fn()
    .mockRejectedValueOnce(new DOMException("Cancelado", "AbortError"))
    .mockRejectedValueOnce(new Error("Falha"));
  vi.stubGlobal("navigator", { share, canShare: () => true });
  expect(await shareOrder(file)).toBe("cancelled");
  await expect(shareOrder(file)).rejects.toThrow("Falha");
});
test("download mantém URL viva até iniciar e depois libera", () => {
  vi.useFakeTimers();
  const revoke = vi.fn();
  vi.stubGlobal("URL", {
    createObjectURL: () => "blob:pdf",
    revokeObjectURL: revoke,
  });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("pedido.pdf");
      expect(this.href).toBe("blob:pdf");
    });
  downloadOrder(file);
  expect(click).toHaveBeenCalledOnce();
  expect(revoke).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(revoke).toHaveBeenCalledWith("blob:pdf");
});
