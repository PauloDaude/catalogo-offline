import { test, expect } from "@playwright/test";
import { prepare } from "./helpers";

for (const [width, height] of [
  [360, 800],
  [800, 1280],
  [1280, 800],
]) {
  test(`catálogo legível e tocável em ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/?visualizacao=cards");
    await expect(page.locator(".product-card")).toHaveCount(10);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);

    for (const button of await page
      .locator(".category-button,.sync-button")
      .all()) {
      const box = await button.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }

    await page.getByRole("searchbox").fill("TESOURA");
    await expect(page.locator(".product-card")).toHaveCount(1);
    await page.getByRole("button", { name: /^Iluminação$/ }).click();
    await expect(page.getByText("Nenhum produto encontrado")).toBeVisible();
  });
}

test("foto ampliada fecha e devolve foco", async ({ page }) => {
  await page.goto("/?visualizacao=cards");
  const trigger = page.getByRole("button", { name: "Ver Tesoura multiuso" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("API indisponível orienta sem tela vazia", async ({ page }) => {
  await page.route("**/demo/catalog.json", (route) => route.abort());
  await page.goto("/?visualizacao=cards");
  await expect(page.getByRole("status")).toContainText(
    "Não foi possível abrir",
  );
  await expect(page.getByRole("searchbox")).toBeVisible();
});

test("IndexedDB negado permite consulta online", async ({ page }) => {
  await page.addInitScript(() => {
    indexedDB.open = () => {
      throw new DOMException("Denied", "SecurityError");
    };
  });
  await page.goto("/?visualizacao=cards");
  await expect(page.locator(".product-card")).toHaveCount(10);
  await expect(page.getByRole("status")).toContainText("armazenamento");
});

test("texto não executa markup e aplicação só acessa origem local", async ({
  page,
}) => {
  const external: string[] = [];
  const origin = new URL(String(test.info().project.use.baseURL)).origin;
  page.on("request", (req) => {
    if (new URL(req.url()).origin !== origin && !req.url().startsWith("blob:"))
      external.push(req.url());
  });
  await page.route("**/demo/catalog.json", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.products[0].name = "<img src=x onerror=alert(1)>";
    await route.fulfill({ json: data });
  });
  await page.goto("/?visualizacao=cards");
  await expect(page.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
  expect(external).toEqual([]);
});

test("detalhes do produto cabem na tela sem rolagem interna", async ({
  page,
}) => {
  for (const [width, height] of [
    [1280, 800],
    [360, 640],
    [640, 360],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/?visualizacao=cards");
    await page
      .getByRole("button", { name: "Ver Panela para o dia a dia", exact: true })
      .click();
    await page
      .locator(".dialog-image")
      .evaluate((image: HTMLImageElement) => image.decode());
    const modal = page.locator(".product-dialog");
    expect(
      await modal.evaluate(
        (element) => element.scrollHeight <= element.clientHeight + 1,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Adicionar ao carrinho", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("button", { name: "Fechar", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    const addButton = page.getByRole("button", {
      name: "Adicionar ao carrinho",
      exact: true,
    });
    expect(
      await addButton.evaluate(
        (element) => element.scrollHeight <= element.clientHeight + 1,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
  }
});

test("oferta permanece no catálogo offline e detalhes usam duas colunas em telas maiores", async ({
  page,
  context,
}) => {
  await page.goto("/?visualizacao=cards");
  const card = page.locator(".product-card").filter({
    has: page.getByRole("heading", { name: "Panela para o dia a dia" }),
  });
  await expect(card.locator("s")).toHaveText("R$ 100,00");
  await expect(card.getByLabel("35% de desconto")).toBeVisible();
  await prepare(page);
  await context.setOffline(true);
  await page.reload();
  await expect(card.locator("s")).toHaveText("R$ 100,00");
  await page.setViewportSize({ width: 1280, height: 800 });
  await card
    .getByRole("button", { name: "Ver Panela para o dia a dia" })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("35% de desconto"),
  ).toBeVisible();
  const photo = await page.locator(".product-detail-photo").boundingBox();
  const info = await page.locator(".product-detail-info").boundingBox();
  expect(photo!.x + photo!.width).toBeLessThan(info!.x);
});

test("card inteiro abre detalhes e preços ficam alinhados entre ofertas e produtos comuns", async ({
  page,
}) => {
  for (const width of [1280, 800, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/?visualizacao=cards");
    const cards = page.locator(".product-card");
    await expect(cards).toHaveCount(10);
    const first = cards.nth(0);
    const second = cards.nth(1);
    await expect(first.getByRole("button", { name: /Adicionar/ })).toHaveCount(
      0,
    );
    const priceA = await first.locator(".product-price").boundingBox();
    const priceB = await second.locator(".product-price").boundingBox();
    expect(priceA!.y).toBeCloseTo(priceB!.y, 0);

    const cardBox = await first.boundingBox();
    const triggerBox = await first
      .getByRole("button", { name: /Ver / })
      .boundingBox();
    expect(triggerBox!.height).toBeCloseTo(cardBox!.height - 2, 0);
    await first.click({ position: { x: 20, y: cardBox!.height - 20 } });
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("button", { name: "Adicionar ao carrinho", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
  }
});

test("ofertas ficam sobre a foto e preços próximos ao nome sem reservar área promocional", async ({
  page,
}) => {
  for (const width of [1280, 800, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/?visualizacao=cards");
    const cards = page.locator(".product-card");
    await expect(cards).toHaveCount(10);
    const offer = cards.nth(0);
    const label = await offer.locator(".offer-label").boundingBox();
    const photo = await offer.locator(".product-image").boundingBox();
    expect(label!.y).toBeGreaterThanOrEqual(photo!.y);
    expect(label!.y + label!.height).toBeLessThanOrEqual(
      photo!.y + photo!.height,
    );

    for (const card of [offer, cards.nth(1)]) {
      const name = await card.getByRole("heading").boundingBox();
      const price = await card.locator(".product-price").boundingBox();
      expect(price!.y - (name!.y + name!.height)).toBeLessThanOrEqual(12);
    }
    const currentPrice = await offer.locator(".product-price").boundingBox();
    const oldPrice = await offer.locator(".previous-price").boundingBox();
    expect(oldPrice!.y).toBeGreaterThanOrEqual(
      currentPrice!.y + currentPrice!.height,
    );
  }
});
