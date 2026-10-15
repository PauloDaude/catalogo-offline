import { expect, type Page } from "@playwright/test";

export async function prepare(page: Page) {
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(10);
  await page
    .getByRole("button", {
      name: "Salvar catálogo para usar sem internet",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Catálogo salvo para usar sem internet",
  );
}

export async function decodeAll(page: Page, count: number) {
  await expect(page.locator(".product-grid img")).toHaveCount(count);

  for (const img of await page.locator(".product-grid img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        img.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
}
