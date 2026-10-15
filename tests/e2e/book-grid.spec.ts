import { test, expect } from "@playwright/test";

for (const width of [360, 800, 1280]) {
  test(`grade de 1 a 5 itens mantém seleção e navegação em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?visualizacao=folhear");
    await page.getByRole("button", { name: "Todas", exact: true }).click();

    for (const count of [1, 2, 3, 4, 5]) {
      await page
        .getByRole("button", {
          name: `Mostrar ${count} ${count === 1 ? "produto" : "produtos"} por tela`,
        })
        .click();
      await expect(page.locator(".book-product")).toHaveCount(count);
      for (const image of await page.locator(".book-product-photo img").all())
        await image.evaluate((el: HTMLImageElement) => el.decode());
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const button of await page.locator(".book-add-to-cart").all()) {
        const box = (await button.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
    }
    await expect(page.getByText("Produtos 1–5 de 10")).toBeVisible();
    const firstNames = await page.locator(".book-product h2").allTextContents();
    await page.locator(".book-add-to-cart").first().click();
    await expect(
      page.getByRole("button", { name: /Abrir carrinho, 1 item/ }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Próximo produto" }).click();
    await expect(page.getByText("Produtos 6–10 de 10")).toBeVisible();
    const nextNames = await page.locator(".book-product h2").allTextContents();
    expect(nextNames.filter((name) => firstNames.includes(name))).toEqual([]);
    await expect(
      page.getByRole("button", { name: "Próximo produto" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Cozinha", exact: true }).click();
    await expect(page.locator(".book-product")).toHaveCount(3);
    await expect(page.getByText("Produtos 1–3 de 3")).toBeVisible();
    await page.getByRole("searchbox").fill("garrafa");
    await expect(page.locator(".book-product")).toHaveCount(1);
    await expect(page.getByText("Produtos 1–1 de 1")).toBeVisible();
  });
}
