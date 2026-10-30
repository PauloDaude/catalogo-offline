import { test, expect } from "@playwright/test";
import { chooseCategory } from "./helpers";

for (const width of [360, 800, 1280]) {
  test(`categorias ocupam uma linha e permitem seleção por toque/teclado em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/demo/catalog.json", async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      const names = [
        "Casa e cozinha",
        "Beleza e higiene",
        "Costura e papelaria",
        "Elétrica e iluminação",
        "Ferramentas e acessórios",
        "Lazer",
      ];
      data.products.forEach((p: { category: string }, i: number) => {
        p.category = names[i % names.length];
      });
      await route.fulfill({ json: data });
    });
    await page.goto("/?visualizacao=cards");
    const filter = page.getByRole("navigation", {
      name: "Categorias",
      exact: true,
    });
    const trigger = filter.getByRole("button", { name: /Categoria$/ });
    await expect(trigger).toBeEnabled();
    await expect(trigger).toHaveText("Todas as categorias");
    expect((await filter.boundingBox())!.height).toBe(48);
    await trigger.click();
    await expect(page.getByRole("option")).toHaveCount(7);
    for (const item of await page.getByRole("option").all())
      expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    await page
      .getByRole("option", { name: "Ferramentas e acessórios", exact: true })
      .click();
    await expect(trigger).toHaveText("Ferramentas e acessórios");
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(page.locator(".product-card")).toHaveCount(1);
    await expect(trigger).toBeFocused();
    await trigger.press("Enter");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveText("Beleza e higiene");
    await chooseCategory(page, "Todas as categorias");
    await expect(page.locator(".product-card")).toHaveCount(10);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 360)
      await page.screenshot({
        path: "/tmp/catalogo-categorias-compactas-mobile.png",
      });
  });
}
