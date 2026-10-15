import { test, expect } from "@playwright/test";

for (const width of [360, 800, 1280]) {
  test(`aviso offline fixo e compacto sem sobrepor carrinho em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/?visualizacao=cards");
    const panel = page.getByRole("region", {
      name: "Disponibilidade do catálogo",
    });
    await expect(panel).toHaveCSS("position", "fixed");
    await expect(
      panel.getByRole("button", { name: "Salvar offline", exact: true }),
    ).toBeVisible();
    const first = (await panel.boundingBox())!;
    expect(first.x).toBe(16);
    expect(first.width).toBeLessThanOrEqual(360);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const after = (await panel.boundingBox())!;
    expect(Math.abs(after.y - first.y)).toBeLessThan(1);
    const cart = (await page
      .getByRole("button", { name: /Abrir carrinho/ })
      .boundingBox())!;
    expect(
      after.x + after.width <= cart.x || after.y + after.height <= cart.y,
    ).toBe(true);
    expect(
      (await panel.getByRole("button").boundingBox())!.height,
    ).toBeGreaterThanOrEqual(48);
    await page.getByRole("searchbox").focus();
    await expect(page.getByRole("searchbox")).toHaveCSS(
      "outline-style",
      "none",
    );
    await expect(page.getByRole("searchbox")).toHaveCSS(
      "border-color",
      "rgb(29, 78, 216)",
    );
  });
}
