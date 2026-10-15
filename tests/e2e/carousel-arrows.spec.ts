import { test, expect } from "@playwright/test";

for (const width of [360, 1280]) {
  test(`setas laterais navegam sem abrir detalhes em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Cozinha", exact: true }).click();
    const previous = page.getByRole("button", {
      name: "Voltar produto",
      exact: true,
    });
    const next = page.getByRole("button", {
      name: "Avançar produto",
      exact: true,
    });
    await page
      .locator(".book-product-photo img")
      .evaluate((el: HTMLImageElement) => el.decode());
    await expect(previous).toBeDisabled();
    const photo = (await page.locator(".book-product-photo").boundingBox())!;
    for (const [arrow, edge] of [
      [previous, photo.x],
      [next, photo.x + photo.width],
    ] as const) {
      const box = (await arrow.boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - edge)).toBeLessThan(1);
      expect(
        Math.abs(box.y + box.height / 2 - photo.y - photo.height / 2),
      ).toBeLessThan(1);
    }
    for (const arrow of [previous, next]) {
      const box = (await arrow.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    await next.click();
    await expect(page.getByText("Produto 2 de 3")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Produto 3 de 3")).toBeVisible();
    await expect(next).toBeDisabled();
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Produto 3 de 3")).toBeVisible();
    await previous.click();
    await expect(page.getByText("Produto 2 de 3")).toBeVisible();
  });
}
