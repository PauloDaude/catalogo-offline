import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 320, height: 720 },
  { width: 800, height: 1100 },
]) {
  test(`acesso ao painel pelo header ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const entry = page.getByRole("link", { name: "Acessar painel" });
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute("href", "/admin");
    const box = await entry.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/catalogo-header-${viewport.width}.png`,
    });
    await entry.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/admin/);
    await expect(
      page.getByRole("heading", { name: "Entrar no painel" }),
    ).toBeVisible();
  });
}
