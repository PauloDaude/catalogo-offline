import { test, expect, type Page } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { PDFDocument } from "pdf-lib";
import { addToCart, prepare } from "./helpers";

const output = ".superpowers/sdd/2026-10-24-pedido-pdf/browser";
async function orderForm(page: Page) {
  await page.getByRole("button", { name: /Abrir carrinho/ }).click();
  await page
    .getByRole("button", { name: "Gerar pedido em PDF", exact: true })
    .click();
  await page
    .getByLabel("Nome do cliente", { exact: true })
    .fill("João da Conceição");
  await page
    .getByLabel("Observações (opcional)")
    .fill("Entregar à tarde, confirmar com o cliente");
  await page.getByRole("button", { name: "Gerar PDF", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido pronto" }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByAltText("Prévia do topo da primeira página do pedido PDF"),
  ).toBeVisible();
}
async function download(page: Page, name: string) {
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
  const file = await promise;
  expect(file.suggestedFilename()).toMatch(
    /^pedido-cirandinha-\d{4}-\d{2}-\d{2}-\d{6}\.pdf$/,
  );
  await mkdir(output, { recursive: true });
  const path = `${output}/${name}.pdf`;
  await file.saveAs(path);
  return path;
}
for (const viewport of [
  { width: 320, height: 720 },
  { width: 800, height: 1100 },
  { width: 800, height: 360 },
]) {
  test(`pedido baixa PDF sem Web Share em ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "canShare", {
        value: () => false,
        configurable: true,
      }),
    );
    await page.goto("/?visualizacao=cards");
    await addToCart(page, "Panela para o dia a dia");
    await orderForm(page);
    await expect(
      page.getByText(/Compartilhamento de PDF indisponível/),
    ).toBeVisible();
    const modal = page.locator(".cart-dialog");
    expect(
      await modal.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    const meta = await page.locator(".order-document-meta > div").boundingBox();
    const amount = await page
      .locator(".order-document-meta .order-total")
      .boundingBox();
    expect(meta!.x + meta!.width).toBeLessThanOrEqual(amount!.x + 1);
    await page.screenshot({
      path: `/tmp/cirandinha-order-${viewport.width}x${viewport.height}.png`,
    });
    const path = await download(
      page,
      `pedido-${viewport.width}x${viewport.height}`,
    );
    const text = execFileSync("pdftotext", ["-layout", path, "-"], {
      encoding: "utf8",
    });
    expect(text).toContain("João da Conceição");
    expect(text).toContain("Antônio Marcos Daúde");
    expect(text).toContain("R$ 65,00");
    expect(text).toContain("#P001");
    expect(text).not.toContain("Sem foto");
    expect(text).toContain("Entregar à tarde");
    await page.getByRole("button", { name: "Voltar ao carrinho" }).click();
    await expect(page.locator(".cart-grand-total")).toHaveText("R$ 65,00");
  });
}
test("arquivo pronto é compartilhado e cancelamento não gera erro", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", {
      value: () => true,
      configurable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: async (data: ShareData) => {
        const file = data.files![0];
        document.documentElement.dataset.shared = `${file.type}:${file.size}:${navigator.userActivation.isActive}`;
        throw new DOMException("Cancelado", "AbortError");
      },
      configurable: true,
    });
  });
  await page.goto("/?visualizacao=cards");
  await addToCart(page, "Panela para o dia a dia");
  await orderForm(page);
  await expect(
    page.getByRole("button", { name: "Compartilhar PDF" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute(
    "data-shared",
    /^application\/pdf:\d+:true$/,
  );
  await expect(page.locator(".order-error")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Baixar PDF" })).toBeEnabled();
});
test("gera PDF após fechar e reabrir offline sem carregar gerador antes", async ({
  page,
  context,
}) => {
  await prepare(page);
  await addToCart(page, "Panela para o dia a dia");
  await page.close();
  const second = await context.newPage();
  await context.setOffline(true);
  await second.goto("/?visualizacao=cards");
  await orderForm(second);
  const path = await download(second, "pedido-offline");
  expect(
    execFileSync("pdftotext", [path, "-"], { encoding: "utf8" }),
  ).toContain("Panela para o dia a dia");
});
test("pedido com 100 produtos, nomes longos e imagens ausentes pagina corretamente", async ({
  page,
}) => {
  const original = JSON.parse(
    await readFile("public/demo/catalog.json", "utf8"),
  );
  const products = Array.from({ length: 100 }, (_, i) => ({
    ...original.products[0],
    id: `test-${i}`,
    code: `P${String(i + 1).padStart(3, "0")}`,
    name: (
      `Produto ${i} ` + "Descrição longa com acentuação e detalhes ".repeat(3)
    ).trim(),
  }));
  await page.route("**/demo/catalog.json", (r) =>
    r.fulfill({ json: { ...original, products } }),
  );
  await page.route("**/demo/photos/*", (r) => r.abort());
  await page.addInitScript(
    (items) =>
      localStorage.setItem("catalogo-selection-v2", JSON.stringify(items)),
    products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      priceCents: p.priceCents,
      quantity: 1,
    })),
  );
  await page.goto("/?visualizacao=cards");
  await expect(page.locator(".product-card")).toHaveCount(100);
  await orderForm(page);
  const path = await download(page, "pedido-100");
  const doc = await PDFDocument.load(await readFile(path));
  expect(doc.getPageCount()).toBeGreaterThan(2);
  const text = execFileSync("pdftotext", ["-layout", path, "-"], {
    encoding: "utf8",
  });
  expect(text).toContain("#P100");
  expect(text).toContain("Sem foto");
  expect(text).toContain("6.500,00");
});

test("foto corrompida não impede gerar valores e texto do pedido", async ({
  page,
}) => {
  await page.route("**/demo/photos/*", (route) =>
    route.fulfill({ body: "imagem inválida", contentType: "image/jpeg" }),
  );
  await page.goto("/?visualizacao=cards");
  await addToCart(page, "Panela para o dia a dia");
  await orderForm(page);
  const path = await download(page, "pedido-foto-corrompida");
  const text = execFileSync("pdftotext", [path, "-"], { encoding: "utf8" });
  expect(text).toContain("Sem foto");
  expect(text).toContain("65,00");
});

test.describe("mudanças em outra aba", () => {
  test.use({ serviceWorkers: "block" });
  test("invalida geração pendente e arquivo pronto", async ({
    page,
    context,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = false;
    await page.route("**/fonts/order-noto-sans.ttf", async (route) => {
      requested = true;
      await gate;
      await route.continue();
    });
    await page.goto("/?visualizacao=cards");
    await addToCart(page, "Panela para o dia a dia");
    const second = await context.newPage();
    await second.goto("/");
    await page.getByRole("button", { name: /Abrir carrinho/ }).click();
    await page
      .getByRole("button", { name: "Gerar pedido em PDF", exact: true })
      .click();
    await page
      .getByLabel("Nome do cliente", { exact: true })
      .fill("Cliente teste");
    await page.getByRole("button", { name: "Gerar PDF", exact: true }).click();
    try {
      await expect.poll(() => requested).toBe(true);
      await second.evaluate(() => {
        const items = JSON.parse(
          localStorage.getItem("catalogo-selection-v2")!,
        ).items;
        items[0].quantity = 2;
        localStorage.setItem(
          "catalogo-selection-v2",
          JSON.stringify({ schemaVersion: 2, items }),
        );
      });
      await expect(page.getByRole("alert")).toContainText("seleção mudou");
    } finally {
      release();
    }
    await expect(
      page.getByRole("button", { name: "Gerar PDF", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Gerar PDF", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Pedido pronto" }),
    ).toBeVisible();
    await expect(page.locator(".order-total")).toHaveText("R$ 130,00");
    await second.evaluate(() => {
      const items = JSON.parse(
        localStorage.getItem("catalogo-selection-v2")!,
      ).items;
      items[0].quantity = 3;
      localStorage.setItem(
        "catalogo-selection-v2",
        JSON.stringify({ schemaVersion: 2, items }),
      );
    });
    await expect(
      page.getByRole("heading", { name: "Pedido pronto" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Baixar PDF" })).toHaveCount(
      0,
    );
  });
});

test("prévia recortada, PDF em memória, botões vermelhos e WhatsApp em texto", async ({
  page,
}) => {
  await page.goto("/?visualizacao=cards");
  await addToCart(page, "Panela para o dia a dia");
  await orderForm(page);
  await expect(
    page.getByAltText("Prévia do topo da primeira página do pedido PDF"),
  ).toBeVisible();
  const crop = page.locator(".order-pdf-preview");
  expect(
    await crop.evaluate((el) => {
      const img = el.querySelector("img")!;
      return img.getBoundingClientRect().height > el.clientHeight;
    }),
  ).toBe(true);
  await expect(page.getByRole("button", { name: "Baixar PDF" })).toHaveCSS(
    "background-color",
    "rgb(235, 16, 0)",
  );
  const first = await download(page, "pedido-cache-primeiro");
  const link = page.getByRole("link", { name: "Enviar pedido pelo WhatsApp" });
  const url = new URL((await link.getAttribute("href"))!);
  expect(url.pathname).toBe("/556296146244");
  expect(url.searchParams.get("text")).toContain("João da Conceição");
  expect(url.searchParams.get("text")).toContain("65,00");
  expect(url.searchParams.get("text")).not.toContain("blob:");
  await page.getByRole("button", { name: "Voltar ao carrinho" }).click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: /Abrir carrinho/ }).click();
  await expect(
    page.getByRole("button", { name: "Ver pedido em PDF" }),
  ).toHaveCSS("background-color", "rgb(235, 16, 0)");
  await page.getByRole("button", { name: "Ver pedido em PDF" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido pronto" }),
  ).toBeVisible();
  expect(await readFile(await download(page, "pedido-cache-segundo"))).toEqual(
    await readFile(first),
  );
  await page.getByRole("button", { name: "Editar dados do pedido" }).click();
  await expect(page.getByLabel("Nome do cliente", { exact: true })).toHaveValue(
    "João da Conceição",
  );
  await expect(page.getByLabel("Observações (opcional)")).toHaveValue(
    "Entregar à tarde, confirmar com o cliente",
  );
});

test("adicionar mostra +1 e contador real, inclusive após diminuir no carrinho", async ({
  page,
}) => {
  await page.goto("/");
  const add = page.getByRole("button", {
    name: "Adicionar Panela para o dia a dia ao carrinho",
    exact: true,
  });
  await add.click();
  await expect(page.locator(".cart-add-pulse")).toHaveText("+1");
  await expect(page.getByLabel("1 no carrinho", { exact: true })).toBeVisible();
  await add.click();
  await expect(page.getByLabel("2 no carrinho", { exact: true })).toBeVisible();
  await expect(add.locator("svg.lucide-plus")).toHaveCSS("width", "16px");
  await page.getByRole("button", { name: /Abrir carrinho/ }).click();
  await page
    .getByRole("button", {
      name: "Diminuir quantidade de Panela para o dia a dia",
    })
    .click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByLabel("1 no carrinho", { exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await add.click();
  await expect(page.locator(".cart-add-pulse").last()).toHaveCSS(
    "animation-name",
    "cart-add-still",
  );
});
