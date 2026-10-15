import { test, expect } from "@playwright/test";

import { prepare, addToCart } from "./helpers";

test("carrinho agrupa, altera quantidades e confirma limpeza", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await addToCart(page, "Tesoura multiuso");
  await addToCart(page, "Tesoura multiuso");
  await addToCart(page, "Garrafa térmica");
  const trigger = page.getByRole("button", { name: /Abrir carrinho, 3 itens/ });
  await expect(trigger).toContainText("R$ 78,00");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await trigger.click();
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 78,00");
  await expect(page.locator(".cart-item img")).toHaveCount(2);
  expect(
    await page
      .locator(".cart-dialog")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Diminuir quantidade de Tesoura multiuso" })
    .click();
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 63,00");
  await page.getByRole("button", { name: "Remover Garrafa térmica" }).click();
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 15,00");
  await page
    .getByRole("button", { name: "Limpar carrinho", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 15,00");
  await page
    .getByRole("button", { name: "Limpar carrinho", exact: true })
    .click();
  await page.getByRole("button", { name: "Sim, limpar" }).click();
  await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Abrir carrinho, 0 itens/ }),
  ).toBeFocused();
});

test("seleção persiste ao fechar e reabrir offline", async ({
  page,
  context,
}) => {
  await prepare(page);
  await addToCart(page, "Tesoura multiuso");
  await addToCart(page, "Tesoura multiuso");
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");
  await reopened
    .getByRole("button", { name: /Abrir carrinho, 2 itens/ })
    .click();
  await expect(reopened.locator(".cart-grand-total")).toHaveText("R$ 30,00");
  const thumbnail = reopened
    .getByRole("dialog")
    .getByRole("img", { name: "Tesoura multiuso" });
  await expect(thumbnail).toBeVisible();
  await thumbnail.evaluate((image: HTMLImageElement) => image.decode());
  expect(
    await thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBeGreaterThan(0);
  await expect(reopened.getByRole("dialog").getByText("#P006")).toBeVisible();
  await reopened
    .getByRole("button", { name: "Aumentar quantidade de Tesoura multiuso" })
    .click();
  await expect(reopened.locator(".cart-grand-total")).toHaveText("R$ 45,00");
});

test("foto ampliada também adiciona ao carrinho", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ver Tesoura multiuso" }).click();
  await page
    .getByRole("button", { name: "Adicionar ao carrinho", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Adicionar ao carrinho (1 na seleção)",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Abrir carrinho, 1 item/ }),
  ).toContainText("R$ 15,00");
});

test("sincronização exige revisão antes de trocar preços e excluir indisponíveis do total", async ({
  page,
  context,
}) => {
  await prepare(page);
  await addToCart(page, "Panela para o dia a dia");
  await addToCart(page, "Vara de pesca");
  await context.route("**/demo/catalog.json", async (route) => {
    const response = await route.fetch();
    const snapshot = await response.json();
    snapshot.revision += 1;
    snapshot.products = snapshot.products
      .filter((product: { id: string }) => product.id !== "vara")
      .map((product: { id: string; priceCents: number }) =>
        product.id === "panela" ? { ...product, priceCents: 6900 } : product,
      );
    await route.fulfill({ json: snapshot });
  });
  await page
    .getByRole("button", { name: "Atualizar catálogo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Abrir carrinho/ }),
  ).toContainText("Revisar valores");
  await page.getByRole("button", { name: /Abrir carrinho/ }).click();
  await expect(page.getByRole("alert")).toContainText(
    "O preço de Panela para o dia a dia mudou",
  );
  await expect(page.getByRole("alert")).toContainText(
    "Vara de pesca não está mais disponível",
  );
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 140,00");
  await page
    .getByRole("button", { name: "Atualizar seleção", exact: true })
    .click();
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 69,00");
  await expect(page.getByText("Indisponível — fora do total")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Aumentar quantidade de Vara de pesca" }),
  ).toBeDisabled();
});

test("botão do carrinho permanece fixo no canto inferior direito durante rolagem", async ({
  page,
}) => {
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.locator(".product-card")).toHaveCount(10);
    const button = page.getByRole("button", { name: /Abrir carrinho/ });
    await expect(button).toHaveCSS("position", "fixed");
    const before = await button.boundingBox();
    expect(before!.x + before!.width).toBeCloseTo(width - 16, 0);
    expect(before!.y + before!.height).toBeCloseTo(784, 0);
    expect(before!.width).toBeLessThan(width - 32);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const after = await button.boundingBox();
    expect(after!.y).toBeCloseTo(before!.y, 0);
    await expect(button).toBeInViewport();
  }
});

test("códigos curtos são únicos e aparecem no card e no carrinho", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".product-card .product-code")).toHaveCount(10);
  const codes = await page
    .locator(".product-card .product-code")
    .allTextContents();
  expect(new Set(codes).size).toBe(10);
  expect(codes.every((code) => /^#P\d{3}$/.test(code))).toBe(true);
  await expect(
    page
      .locator(".product-card")
      .filter({
        has: page.getByRole("heading", {
          name: "Tesoura multiuso",
          exact: true,
        }),
      })
      .getByText("#P006"),
  ).toBeVisible();
  await addToCart(page, "Tesoura multiuso");
  await page.getByRole("button", { name: /Abrir carrinho/ }).click();
  await expect(page.getByRole("dialog").getByText("#P006")).toBeVisible();
});
