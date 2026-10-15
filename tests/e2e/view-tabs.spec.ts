import { test, expect } from "@playwright/test";

for (const width of [320, 800, 1280]) {
  test(`abas abrem folhear por padrão e mantêm carrinho em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const book = page.getByRole("tab", { name: "Folhear catálogo" });
    const cards = page.getByRole("tab", { name: "Ver em cards" });
    await expect(book).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("tabpanel", { name: "Folhear catálogo" }),
    ).toBeVisible();
    await expect(page.locator(".book-product")).toHaveCount(1);
    await page
      .getByRole("button", {
        name: "Adicionar Panela para o dia a dia ao carrinho",
      })
      .click();
    await cards.click();
    await expect(cards).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".product-card")).toHaveCount(10);
    await expect(
      page.getByRole("button", { name: /Abrir carrinho, 1 item/ }),
    ).toBeVisible();
    await page.reload();
    await expect(cards).toHaveAttribute("aria-selected", "true");
    await cards.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(book).toHaveAttribute("aria-selected", "true");
    await expect(book).toBeFocused();
    await expect(
      page.getByRole("button", { name: /Abrir carrinho, 1 item/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const tab of [book, cards])
      expect((await tab.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  });
}
