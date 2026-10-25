// @vitest-environment node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { expect, test, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createOrderSnapshot } from "./model";
import { generateOrderPdf } from "./pdf";

vi.stubGlobal("fetch", async (url: string) => {
  if (url.includes("missing")) return new Response("", { status: 404 });
  const bytes = await readFile(`public/${url.replace(/^\//, "")}`);
  return new Response(bytes);
});
for (const count of [1, 100, 500]) {
  test(`PDF válido com ${count} produtos, acentos e sem fotos`, async () => {
    const order = createOrderSnapshot({
      customerName: "João da Conceição",
      notes: "Entregar à tarde\nObservação com acentuação",
      pendingChanges: false,
      catalogReady: true,
      now: new Date("2026-10-24T02:00:00Z"),
      items: Array.from({ length: count }, (_, i) => ({
        id: String(i),
        code: "P001",
        name:
          i === 0
            ? "Garrafa térmica com alça e tampa — azul 💙"
            : "Produto " + i,
        quantity: 2,
        priceCents: 6500,
      })),
    });
    const file = await generateOrderPdf(
      order,
      new Map([["0", "/missing.jpg"]]),
    );
    expect(file.type).toBe("application/pdf");
    expect(file.name).toBe("pedido-cirandinha-2026-10-23-230000.pdf");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(count === 1 ? 1 : 2);
    expect(doc.getPages().every((p) => Math.round(p.getWidth()) === 595)).toBe(
      true,
    );
    await mkdir(".superpowers/sdd/2026-10-24-pedido-pdf/pdfs", {
      recursive: true,
    });
    await writeFile(
      `.superpowers/sdd/2026-10-24-pedido-pdf/pdfs/pedido-${count}.pdf`,
      bytes,
    );
  }, 20000);
}
