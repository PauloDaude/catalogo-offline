import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";

test("toast de confirmação desaparece e adicionar funciona na grade e modal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await prepare(page);
  await expect(page.locator(".sync-text")).toHaveCount(0, { timeout: 6500 });
  await expect(
    page.getByRole("button", { name: "Atualizar", exact: true }),
  ).toBeVisible();
  const card = page.locator(".product-card").filter({
    has: page.getByRole("heading", {
      name: "Panela para o dia a dia",
      exact: true,
    }),
  });
  const add = card.getByRole("button", {
    name: "Adicionar Panela para o dia a dia ao carrinho",
    exact: true,
  });
  const priceBox = await card.locator(".product-price").boundingBox();
  const addBox = await add.boundingBox();
  expect(
    priceBox!.x + priceBox!.width <= addBox!.x ||
      priceBox!.y + priceBox!.height <= addBox!.y,
  ).toBe(true);
  await add.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(card.getByLabel("1 no carrinho", { exact: true })).toBeVisible();
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(card.getByLabel("2 no carrinho", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await card
    .getByRole("button", { name: "Ver Panela para o dia a dia", exact: true })
    .click();
  const button = page
    .getByRole("dialog")
    .getByRole("button", { name: "Adicionar ao carrinho", exact: true });
  await expect(button).toHaveText("Adicionar2");
  const count = page
    .getByRole("dialog")
    .getByLabel("2 no carrinho", { exact: true });
  const b = await button.boundingBox(),
    c = await count.boundingBox();
  expect(c!.y).toBeLessThan(b!.y);
  expect(c!.x).toBeGreaterThan(b!.x + b!.width / 2);
  await button.click();
  await expect(
    page.getByRole("dialog").getByLabel("3 no carrinho", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/catalogo-grid-modal-feedback.png" });
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(card.getByLabel("3 no carrinho", { exact: true })).toBeVisible();
  await page.screenshot({ path: "/tmp/catalogo-grid-feedback.png" });
});
