import { test, expect } from "@playwright/test";

for (const [width, height] of [
  [360, 800],
  [800, 1280],
  [1280, 800],
]) {
  test(`catálogo legível e tocável em ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".product-card")).toHaveCount(10);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);

    for (const button of await page
      .locator(".category-button,.sync-button")
      .all()) {
      const box = await button.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }

    await page.getByRole("searchbox").fill("TESOURA");
    await expect(page.locator(".product-card")).toHaveCount(1);
    await page.getByRole("button", { name: /^Iluminação$/ }).click();
    await expect(page.getByText("Nenhum produto encontrado")).toBeVisible();
  });
}

test("foto ampliada fecha e devolve foco", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Ver Tesoura multiuso" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("API indisponível orienta sem tela vazia", async ({ page }) => {
  await page.route("**/demo/catalog.json", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText(
    "Não foi possível abrir",
  );
  await expect(page.getByRole("searchbox")).toBeVisible();
});

test("IndexedDB negado permite consulta online", async ({ page }) => {
  await page.addInitScript(() => {
    indexedDB.open = () => {
      throw new DOMException("Denied", "SecurityError");
    };
  });
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(10);
  await expect(page.getByRole("status")).toContainText("armazenamento");
});

test("texto não executa markup e aplicação só acessa origem local", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (req) => {
    if (
      !req.url().startsWith("http://127.0.0.1:4173") &&
      !req.url().startsWith("blob:")
    )
      external.push(req.url());
  });
  await page.route("**/demo/catalog.json", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.products[0].name = "<img src=x onerror=alert(1)>";
    await route.fulfill({ json: data });
  });
  await page.goto("/");
  await expect(page.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
  expect(external).toEqual([]);
});
