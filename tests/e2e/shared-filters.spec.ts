import { test, expect } from "@playwright/test";

for (const width of [360, 800, 1280]) {
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
    await filters.getByRole("button", { name: "Pesca", exact: true }).click();
    await page.getByRole("searchbox").fill("kit");
    await expect(
      page.getByRole("button", { name: "Ver Kit de pesca", exact: true }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Ver grade" }).click();
    await expect(page.getByRole("searchbox")).toHaveValue("kit");
    await expect(
      filters.getByRole("button", { name: "Pesca", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
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
      filters.getByRole("button", { name: "Todas", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const tabs = (await page.getByRole("tablist").boundingBox())!;
    const search = (await page.getByRole("searchbox").boundingBox())!;
    if (width > 760)
      expect(
        Math.abs(tabs.y + tabs.height / 2 - search.y - search.height / 2),
      ).toBeLessThan(2);
    else expect(Math.abs(tabs.x - search.x)).toBeLessThan(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
