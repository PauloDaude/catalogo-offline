import { chooseCategory } from "./helpers";
import { test, expect } from "@playwright/test";

for (const width of [360, 700, 800, 1280]) {
  test(`filtros únicos preservados nas duas abas e pesquisa alinhada em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("searchbox")).toHaveCount(1);
    await expect(
      page.getByRole("navigation", { name: "Categorias", exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByText("Produtos por tela", { exact: true }),
    ).toHaveCount(0);
    const filters = page.getByRole("navigation", {
      name: "Categorias",
      exact: true,
    });
    await chooseCategory(page, "Pesca");
    await page.getByRole("searchbox").fill("kit");
    await expect(
      page.getByRole("button", { name: "Ver Kit de pesca", exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Ver grade" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("kit");
    await expect(
      filters.getByRole("button", { name: /Categoria$/ }),
    ).toHaveText("Pesca");
    await expect(page.locator(".product-card")).toHaveCount(1);
    await page.getByRole("tab", { name: "Folhear catálogo" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("kit");
    await expect(page.getByText("Produto 1 de 1")).toBeVisible();
    await page.getByRole("searchbox").fill("sem resultados");
    await page
      .getByRole("button", { name: "Limpar filtros", exact: true })
      .click();
    await expect(page.getByRole("searchbox")).toHaveValue("");
    await expect(
      filters.getByRole("button", { name: /Categoria$/ }),
    ).toHaveText("Todas as categorias");
    const tabs = (await page.getByRole("tablist").boundingBox())!;
    const search = (await page.getByRole("searchbox").boundingBox())!;
    const category = (await filters.boundingBox())!;
    expect(search.y).toBeGreaterThanOrEqual(tabs.y + tabs.height);
    if (width > 650) {
      expect(
        Math.abs(
          search.y + search.height / 2 - category.y - category.height / 2,
        ),
      ).toBeLessThan(2);
      expect(search.x + search.width).toBeLessThanOrEqual(category.x - 16);
    } else {
      expect(category.y).toBeGreaterThanOrEqual(search.y + search.height);
      expect(Math.abs(tabs.x - search.x)).toBeLessThan(2);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
