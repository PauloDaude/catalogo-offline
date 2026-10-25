// @vitest-environment node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { expect, test, vi } from "vitest";
import { PDFDocument, PDFPage } from "pdf-lib";
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

test("nome maior que uma página continua sem desenhar fora da área útil", async () => {
  const draw = vi.spyOn(PDFPage.prototype, "drawText");
  try {
    const order = createOrderSnapshot({
      customerName: "Cliente",
      notes: "",
      pendingChanges: false,
      catalogReady: true,
      now: new Date(),
      items: [
        { id: "1", name: "W".repeat(2000), quantity: 1, priceCents: 100 },
      ],
    });
    const file = await generateOrderPdf(order, new Map());
    expect(
      (await PDFDocument.load(await file.arrayBuffer())).getPageCount(),
    ).toBeGreaterThan(1);
    for (const [, options] of draw.mock.calls)
      expect(options!.y).toBeGreaterThanOrEqual(30);
  } finally {
    draw.mockRestore();
  }
});
test("valores inteiros seguros cabem nas colunas sem sobrepor quantidade", async () => {
  const draw = vi.spyOn(PDFPage.prototype, "drawText");
  try {
    const order = createOrderSnapshot({
      customerName: "Cliente",
      notes: "",
      pendingChanges: false,
      catalogReady: true,
      now: new Date(),
      items: [
        {
          id: "1",
          name: "Produto",
          quantity: 1,
          priceCents: Number.MAX_SAFE_INTEGER,
        },
      ],
    });
    await generateOrderPdf(order, new Map());
    const amounts = draw.mock.calls.filter(
      ([text, options]) => text.startsWith("R$") && options!.size! < 10,
    );
    expect(amounts).toHaveLength(2);
    expect(amounts[0][1]!.x).toBeGreaterThanOrEqual(378);
    expect(amounts[1][1]!.x).toBeGreaterThanOrEqual(460);
  } finally {
    draw.mockRestore();
  }
});

test("cliente, produto e observações nos limites continuam legíveis e paginados", async () => {
  const draw = vi.spyOn(PDFPage.prototype, "drawText");
  try {
    const order = createOrderSnapshot({
      customerName: "Cliente " + "W".repeat(112),
      notes: "Observação com acentuação e entrega\n".repeat(40).slice(0, 1000),
      pendingChanges: false,
      catalogReady: true,
      now: new Date(),
      items: [
        {
          id: "1",
          code: "P001",
          name: "W".repeat(160),
          quantity: 999,
          priceCents: 999999999,
        },
      ],
    });
    const file = await generateOrderPdf(order, new Map());
    expect(
      (await PDFDocument.load(await file.arrayBuffer())).getPageCount(),
    ).toBeGreaterThan(1);
    for (const [, options] of draw.mock.calls)
      expect(options!.y).toBeGreaterThanOrEqual(30);
    await writeFile(
      ".superpowers/sdd/2026-10-24-pedido-pdf/pdfs/pedido-limites.pdf",
      new Uint8Array(await file.arrayBuffer()),
    );
  } finally {
    draw.mockRestore();
  }
});

test("cabeçalhos da tabela usam fonte em negrito", async () => {
  const draw = vi.spyOn(PDFPage.prototype, "drawText");
  try {
    const order = createOrderSnapshot({
      customerName: "Cliente",
      notes: "",
      pendingChanges: false,
      catalogReady: true,
      now: new Date(),
      items: [{ id: "1", name: "Produto", priceCents: 100, quantity: 1 }],
    });
    await generateOrderPdf(order, new Map());
    for (const label of [
      "FOTO",
      "PRODUTO / CÓDIGO",
      "QTD.",
      "UNITÁRIO",
      "SUBTOTAL",
    ]) {
      const call = draw.mock.calls.find(([value]) => value === label);
      expect(call?.[1]?.font?.name).toMatch(/Bold/);
    }
  } finally {
    draw.mockRestore();
  }
});
