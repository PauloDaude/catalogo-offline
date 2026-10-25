import { PDFDocument, rgb, type PDFFont, type PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { OrderSnapshot } from "./model";
import { price } from "../catalog/price";

const blue = rgb(20 / 255, 59 / 255, 132 / 255);
const ink = rgb(0.12, 0.17, 0.25);
const muted = rgb(0.39, 0.44, 0.52);
const pale = rgb(0.95, 0.97, 0.99);
const margin = 42.52;
const width = 595.28;
const height = 841.89;
const base = import.meta.env.BASE_URL;

async function asset(path: string): Promise<ArrayBuffer> {
  const response = await fetch(path);
  if (!response.ok)
    throw new Error(
      "Não foi possível carregar os recursos do PDF, prepare o catálogo offline ou confira a conexão",
    );
  return response.arrayBuffer();
}

// Limit each source image before embedding; decoded images are released immediately.
async function thumbnail(url: string): Promise<Uint8Array | null> {
  let bitmap: ImageBitmap | undefined;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    bitmap = await createImageBitmap(await response.blob());
    const ratio = Math.min(1, 160 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

function cleanText(text: string, font: PDFFont): string {
  const supported = new Set(font.getCharacterSet());
  return Array.from(text.normalize("NFC"))
    .map((char) =>
      char === "\n" || supported.has(char.codePointAt(0)!) ? char : "?",
    )
    .join("")
    .replace(/\r/g, "");
}
function wrap(
  text: string,
  maxWidth: number,
  size: number,
  font: PDFFont,
): string[] {
  const result: string[] = [];
  for (const paragraph of cleanText(text, font).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (line && font.widthOfTextAtSize(`${line} ${word}`, size) <= maxWidth) {
        line += ` ${word}`;
        continue;
      }
      if (line) {
        result.push(line);
        line = "";
      }
      for (const char of word) {
        if (line && font.widthOfTextAtSize(line + char, size) > maxWidth) {
          result.push(line);
          line = "";
        }
        line += char;
      }
    }
    result.push(line);
  }
  return result;
}
function dateParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Araguaina",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (kind: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === kind)!.value;
  return {
    display: `${get("day")}/${get("month")}/${get("year")}`,
    file: `${get("year")}-${get("month")}-${get("day")}-${get("hour")}${get("minute")}${get("second")}`,
  };
}

export async function generateOrderPdf(
  order: OrderSnapshot,
  images: ReadonlyMap<string, string>,
): Promise<File> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(
    await asset(`${base}fonts/order-noto-sans.ttf`),
    { subset: true },
  );
  const logo = await doc.embedPng(
    await asset(`${base}logos/logo-cirandinha.png`),
  );
  doc.setTitle("Pedido de venda — Cirandinha");
  doc.setAuthor(order.sellerName);
  doc.setCreationDate(new Date(order.generatedAt));
  const dates = dateParts(order.generatedAt);
  let page = doc.addPage([width, height]);
  let y = height - margin;
  const text = (value: string, x: number, at: number, size = 9, color = ink) =>
    page.drawText(cleanText(value, font), { x, y: at, size, font, color });
  const right = (
    value: string,
    edge: number,
    at: number,
    size = 9,
    color = ink,
  ) => {
    const clean = cleanText(value, font);
    text(clean, edge - font.widthOfTextAtSize(clean, size), at, size, color);
  };
  const money = (
    value: string,
    edge: number,
    at: number,
    availableWidth: number,
  ) => {
    const clean = cleanText(value, font);
    const size = Math.min(
      8.5,
      availableWidth / font.widthOfTextAtSize(clean, 1),
    );
    right(clean, edge, at, size);
  };
  const drawImage = (
    image: PDFImage,
    x: number,
    bottom: number,
    boxW: number,
    boxH: number,
  ) => {
    const scale = Math.min(boxW / image.width, boxH / image.height);
    const w = image.width * scale,
      h = image.height * scale;
    page.drawImage(image, {
      x: x + (boxW - w) / 2,
      y: bottom + (boxH - h) / 2,
      width: w,
      height: h,
    });
  };
  function heading(continued = false) {
    drawImage(logo, margin, height - margin - 36, 170, 36);
    right("PEDIDO DE VENDA", width - margin, height - margin - 14, 15, blue);
    right(dates.display, width - margin, height - margin - 32, 9, muted);
    y = height - margin - 56;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1.5,
      color: blue,
    });
    y -= 22;
    text("VENDEDOR", margin, y, 7.5, muted);
    text(order.sellerName, margin, y - 15, 10);
    y -= 39;
    text(
      continued ? "CLIENTE · CONTINUAÇÃO" : "CLIENTE",
      margin,
      y,
      7.5,
      muted,
    );
    y -= 16;
    for (const line of wrap(order.customerName, width - 2 * margin, 11, font)) {
      text(line, margin, y, 11);
      y -= 15;
    }
    y -= 8;
  }
  function tableHeader() {
    page.drawRectangle({
      x: margin,
      y: y - 25,
      width: width - 2 * margin,
      height: 25,
      color: blue,
    });
    text("FOTO", margin + 9, y - 16, 7.5, rgb(1, 1, 1));
    text("PRODUTO / CÓDIGO", margin + 62, y - 16, 7.5, rgb(1, 1, 1));
    right("QTD.", 368, y - 16, 7.5, rgb(1, 1, 1));
    right("UNITÁRIO", 450, y - 16, 7.5, rgb(1, 1, 1));
    right("SUBTOTAL", width - margin - 10, y - 16, 7.5, rgb(1, 1, 1));
    y -= 25;
  }
  function nextPage(withTable: boolean) {
    page = doc.addPage([width, height]);
    heading(true);
    if (withTable) tableHeader();
  }
  heading();
  tableHeader();
  const pageRowTop = y;
  for (const [index, item] of order.items.entries()) {
    const lines = wrap(item.name, 218, 9, font);
    const url = images.get(item.id);
    const bytes = url ? await thumbnail(url) : null;
    let embedded: PDFImage | undefined;
    if (bytes) {
      try {
        embedded = await doc.embedJpg(bytes);
      } catch {
        /* Text remains usable when photo is invalid. */
      }
    }
    const fullHeight = Math.max(66, lines.length * 13 + 30);
    if (fullHeight <= pageRowTop - 70 && fullHeight > y - 70) nextPage(true);
    let offset = 0;
    while (offset < lines.length) {
      // A single unusually long name can occupy several pages. Keep each text
      // line whole, and show the photo and monetary amounts only once.
      if (y < 136) nextPage(true);
      const capacity = Math.max(1, Math.floor((y - 70 - 30) / 13));
      const segment = lines.slice(offset, offset + capacity);
      const rowHeight = Math.max(66, segment.length * 13 + 30);
      const bottom = y - rowHeight;
      if (index % 2 === 0)
        page.drawRectangle({
          x: margin,
          y: bottom,
          width: width - 2 * margin,
          height: rowHeight,
          color: pale,
        });
      if (offset === 0) {
        if (embedded)
          drawImage(
            embedded,
            margin + 5,
            bottom + (rowHeight - 48) / 2,
            48,
            48,
          );
        else text("Sem foto", margin + 6, bottom + rowHeight / 2 - 3, 7, muted);
        right(String(item.quantity), 368, y - 23);
        money(price(item.priceCents), 450, y - 23, 72);
        money(
          price(item.subtotalCents),
          width - margin - 10,
          y - 23,
          width - margin - 10 - 460,
        );
      }
      let lineY = y - 19;
      for (const line of segment) {
        text(line, margin + 62, lineY);
        lineY -= 13;
      }
      text(
        `${item.code ? "#" + item.code : "—"}${offset ? " · continuação" : ""}`,
        margin + 62,
        lineY - 3,
        8,
        muted,
      );
      y = bottom;
      offset += segment.length;
      if (offset < lines.length) nextPage(true);
    }
  }
  if (y < 140) nextPage(false);
  y -= 18;
  page.drawRectangle({
    x: margin,
    y: y - 46,
    width: width - 2 * margin,
    height: 46,
    color: blue,
  });
  text("TOTAL DO PEDIDO", margin + 14, y - 28, 10, rgb(1, 1, 1));
  right(price(order.totalCents), width - margin - 14, y - 30, 18, rgb(1, 1, 1));
  y -= 72;
  if (order.notes) {
    text("OBSERVAÇÕES", margin, y, 8, muted);
    y -= 18;
    for (const line of wrap(order.notes, width - 2 * margin, 9, font)) {
      if (y < 70) {
        nextPage(false);
        text("OBSERVAÇÕES · CONTINUAÇÃO", margin, y, 8, muted);
        y -= 18;
      }
      text(line, margin, y);
      y -= 14;
    }
  }
  const pages = doc.getPages();
  for (const [index, p] of pages.entries()) {
    page = p;
    page.drawLine({
      start: { x: margin, y: 49 },
      end: { x: width - margin, y: 49 },
      thickness: 0.5,
      color: rgb(0.82, 0.85, 0.89),
    });
    text("Documento comercial, não é nota fiscal", margin, 33, 7, muted);
    right(
      `Página ${index + 1} de ${pages.length}`,
      width - margin,
      33,
      7,
      muted,
    );
  }
  const bytes = await doc.save();
  return new File(
    [bytes as Uint8Array<ArrayBuffer>],
    `pedido-cirandinha-${dates.file}.pdf`,
    { type: "application/pdf" },
  );
}
