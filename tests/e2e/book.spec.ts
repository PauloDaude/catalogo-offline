import { test, expect } from "@playwright/test";
import { prepare } from "./helpers";

for (const [width, height, perPage, pages] of [
  [1280, 800, 2, 2],
  [800, 1280, 2, 2],
  [360, 800, 1, 3],
  [640, 360, 1, 3],
]) {
  test(`folhear Cozinha em ${width}x${height} mantém fotos inteiras e navegação`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/?visualizacao=folhear");
    await expect(page.locator(".book-product")).toHaveCount(perPage);
    await expect(page.getByText(`Página 1 de ${pages}`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Página anterior" }),
    ).toBeDisabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const img of await page.locator(".book-product-photo img").all()) {
      await expect(img).toHaveCSS("object-fit", "contain");
      await img.evaluate((element: HTMLImageElement) => element.decode());
      const box = await img.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(160);
    }
    const names: string[] = [];
    for (let i = 1; i <= pages; i++) {
      await expect(page.getByText(`Página ${i} de ${pages}`)).toBeVisible();
      names.push(...(await page.locator(".book-product h3").allTextContents()));
      if (i < pages)
        await page.getByRole("button", { name: "Próxima página" }).click();
    }
    expect(names).toEqual([
      "Panela para o dia a dia",
      "Utensílios de cozinha",
      "Garrafa térmica",
    ]);
    await expect(
      page.getByRole("button", { name: "Próxima página" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Página anterior" }).click();
    await expect(
      page.getByText(`Página ${pages - 1} de ${pages}`),
    ).toBeVisible();
    const next = await page
      .getByRole("button", { name: "Próxima página" })
      .boundingBox();
    expect(next!.height).toBeGreaterThanOrEqual(48);
  });
}

test("páginas reabrem offline e compartilham seleção com visual anterior", async ({
  page,
  context,
}) => {
  await prepare(page);
  await context.setOffline(true);
  await page.goto("/?visualizacao=folhear");
  await expect(page.locator(".book-product")).toHaveCount(2);
  await page.getByRole("button", { name: "Próxima página" }).click();
  await page.getByRole("button", { name: "Ver Garrafa térmica" }).click();
  await page
    .locator(".dialog-image")
    .evaluate((image: HTMLImageElement) => image.decode());
  await page
    .getByRole("button", { name: "Adicionar ao carrinho", exact: true })
    .click();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Visual anterior" }).click();
  await expect(page.locator(".product-card")).toHaveCount(10);
  await page.getByRole("button", { name: /Abrir carrinho, 1 item/ }).click();
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 48,00");
  await page
    .locator(".cart-item img")
    .evaluate((image: HTMLImageElement) => image.decode());
});

test("pesquisa e redimensionamento não deixam página vazia", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/?visualizacao=folhear");
  await page.getByRole("button", { name: "Próxima página" }).click();
  await page.getByRole("button", { name: "Próxima página" }).click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByText("Página 2 de 2")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ver Garrafa térmica" }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("panela");
  await expect(page.getByText("Página 1 de 1")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ver Panela para o dia a dia" }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("produto inexistente");
  await expect(page.getByText("Nenhum produto encontrado")).toBeVisible();
  await page.getByRole("button", { name: "Limpar pesquisa" }).click();
  await expect(page.getByText("Página 1 de 2")).toBeVisible();
});
