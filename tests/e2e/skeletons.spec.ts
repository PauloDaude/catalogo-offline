import { test, expect } from "@playwright/test";

for (const mode of ["cards", "folhear"])
  for (const width of [390, 800]) {
    test(`skeleton de ${mode} em ${width}px durante resposta lenta e conteúdo após carregar`, async ({
      page,
    }) => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route("**/demo/catalog.json", async (route) => {
        await gate;
        await route.continue();
      });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1280 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/?visualizacao=${mode}`);
      const skeleton = page.locator(
        mode === "cards" ? ".skeleton-grid" : ".skeleton-book",
      );
      await expect(skeleton).toBeVisible();
      await expect(skeleton.locator(".skeleton").first()).toHaveCSS(
        "animation-name",
        "none",
      );
      await expect(page.getByText("Nenhum produto encontrado")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/catalogo-skeleton-${mode}-${width}.png`,
      });
      release();
      await expect(skeleton).toHaveCount(0);
      await expect(
        page.getByText("10 produtos", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: "Ver Panela para o dia a dia",
          exact: true,
        }),
      ).toBeVisible();
    });
  }

test("erro de consulta termina skeleton e mostra orientação", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/demo/catalog.json", async (route) => {
    await gate;
    await route.abort();
  });
  await page.goto("/?visualizacao=cards");
  await expect(page.locator(".skeleton-grid")).toBeVisible();
  release();
  await expect(page.locator(".skeleton-grid")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText(
    "Não foi possível abrir",
  );
});

test("foto lenta tem skeleton até a decodificação terminar", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/demo/photos/panela.webp", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  const photo = page.locator(".book-product-photo img");
  await expect(photo).toHaveAttribute("data-loading", "true");
  release();
  await expect(photo).not.toHaveAttribute("data-loading");
  expect(
    await photo.evaluate((img: HTMLImageElement) => img.naturalWidth > 0),
  ).toBe(true);
});
