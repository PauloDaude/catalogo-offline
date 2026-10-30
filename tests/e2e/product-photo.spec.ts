import { test, expect } from "@playwright/test";
import path from "node:path";

for (const [width, height] of [
  [360, 800],
  [390, 844],
  [800, 360],
  [1280, 800],
]) {
  test(`foto completa e fechar confortável em ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.route("**/demo/catalog.json", (route) =>
      route.fulfill({
        json: {
          schemaVersion: 2,
          revision: 50,
          updatedAt: "2026-10-30T12:00:00.000Z",
          products: [
            {
              id: "lanterna",
              code: "P009",
              name: "Lanterna recarregável GP6",
              category: "Elétrica e iluminação",
              imagePath: "photos/lanterna.webp",
              hasVariants: true,
              variantAttribute: "Potência",
              variants: [
                {
                  id: "v1",
                  code: "P009-V01",
                  label: "5 W",
                  priceCents: 3890,
                  imagePath: "photos/lanterna.webp",
                },
                {
                  id: "v2",
                  code: "P009-V02",
                  label: "3 W",
                  priceCents: 2790,
                  imagePath: "photos/lanterna.webp",
                },
              ],
            },
          ],
        },
      }),
    );
    await page.route("**/demo/photos/lanterna.webp", (route) =>
      route.fulfill({
        path: path.resolve(
          "docs/produtos/imagens-webp/IMG-20261002-WA0588.webp",
        ),
        contentType: "image/webp",
      }),
    );
    await page.goto("/?visualizacao=cards");
    await page
      .getByRole("button", {
        name: "Ver Lanterna recarregável GP6",
        exact: true,
      })
      .click();
    const details = page.getByRole("dialog");
    await expect(page.locator(".product-dialog")).not.toHaveAttribute(
      "data-entering",
    );
    const close = details.getByRole("button", { name: "Fechar", exact: true });
    const bounds = await close.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(96);
    expect(bounds!.height).toBeGreaterThanOrEqual(48);
    const image = details.locator(".dialog-image");
    await expect(image).toHaveCSS("object-fit", "contain");
    const imageBox = await image.boundingBox();
    const frame = await details.locator(".product-detail-photo").boundingBox();
    expect(imageBox!.height).toBeLessThanOrEqual(frame!.height + 1);
    const photoButton = details.getByRole("button", {
      name: "Ver foto completa de Lanterna recarregável GP6",
    });
    await photoButton.click();
    const photo = page.getByRole("dialog", {
      name: "Foto de Lanterna recarregável GP6",
    });
    await expect(photo).toBeVisible();
    const overlay = page.locator(".product-photo-overlay");
    await expect(overlay).toHaveCSS("background-color", "rgba(0, 0, 0, 0.78)");
    await expect(overlay).toHaveCSS("backdrop-filter", "blur(8px)");
    const full = photo.locator(".product-photo-full");
    await expect(full).toHaveCSS("object-fit", "contain");
    expect(
      await full.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    ).toBe(true);
    const viewport = await page.locator(".product-photo-viewer").boundingBox();
    expect(viewport!.width).toBe(width);
    expect(viewport!.height).toBe(height);
    expect(viewport!.x).toBe(0);
    expect(viewport!.y).toBe(0);
    const fullBox = await full.boundingBox();
    expect(fullBox!.y + fullBox!.height).toBeLessThanOrEqual(height + 1);
    await expect(
      photo.getByRole("button", { name: "Fechar", exact: true }),
    ).toHaveCount(0);
    const titleBox = await photo.getByRole("heading").boundingBox();
    const stage = photo.locator(".product-photo-stage");
    const stageBox = await stage.boundingBox();
    expect(
      stageBox!.y - (titleBox!.y + titleBox!.height),
    ).toBeGreaterThanOrEqual(8);
    expect(stageBox!.y - (titleBox!.y + titleBox!.height)).toBeLessThanOrEqual(
      16,
    );
    await photo.getByRole("button", { name: "Aproximar foto" }).click();
    await expect(
      photo.getByRole("button", { name: "Restaurar tamanho da foto" }),
    ).toHaveText("150%");
    const zoomed = await full.boundingBox();
    expect(zoomed!.width).toBeGreaterThan(fullBox!.width * 1.4);
    await expect(stage).toHaveCSS("overflow", "hidden");
    await page.mouse.move(
      stageBox!.x + stageBox!.width / 2,
      stageBox!.y + stageBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      stageBox!.x + stageBox!.width / 2 + 25,
      stageBox!.y + stageBox!.height / 2 + 20,
    );
    await page.mouse.up();
    const panned = await full.boundingBox();
    expect(panned!.x).toBeGreaterThan(zoomed!.x);
    await photo
      .getByRole("button", { name: "Restaurar tamanho da foto" })
      .click();
    if (width === 390) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: true,
        maxTouchPoints: 2,
      });
      const cx = stageBox!.x + stageBox!.width / 2,
        cy = stageBox!.y + stageBox!.height / 2;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [
          { x: cx - 20, y: cy, id: 1 },
          { x: cx + 20, y: cy, id: 2 },
        ],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: cx - 35, y: cy, id: 1 },
          { x: cx + 35, y: cy, id: 2 },
        ],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(async () =>
          parseInt(
            await photo
              .getByRole("button", { name: "Restaurar tamanho da foto" })
              .innerText(),
          ),
        )
        .toBeGreaterThanOrEqual(150);
      await photo
        .getByRole("button", { name: "Restaurar tamanho da foto" })
        .click();
      await cdp.detach();
    }
    if (width === 390)
      await page.screenshot({
        path: "/tmp/catalogo-photo-fullscreen-mobile.png",
      });
    await full.click();
    await expect(photo).toBeVisible();
    await page.mouse.click(8, height / 2);
    await expect(photo).toHaveCount(0);
    await expect(photoButton).toBeFocused();
    await photoButton.click();
    await expect(photo).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(photo).toHaveCount(0);
    await expect(photoButton).toBeFocused();
    await expect(
      details.getByRole("button", { name: "Adicionar ao carrinho" }),
    ).toBeDisabled();
    await close.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}
