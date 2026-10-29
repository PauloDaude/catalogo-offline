import { test, expect } from "@playwright/test";

for (const [width, height] of [
  [360, 900],
  [768, 1024],
  [1024, 768],
  [1280, 900],
  [844, 390],
]) {
  for (const [photoWidth, photoHeight] of [
    [600, 900],
    [800, 800],
    [1200, 600],
  ]) {
    test(`foto ${photoWidth}x${photoHeight} preserva proporção e faixa lateral em ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/?visualizacao=cards");
      const base64 = await page.evaluate(
        ([w, h]) => {
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#cbd5e1";
          ctx.fillRect(0, 0, w, h);
          return canvas.toDataURL("image/webp").split(",")[1];
        },
        [photoWidth, photoHeight],
      );
      await page.route("**/demo/photos/panela.webp", (route) =>
        route.fulfill({
          body: Buffer.from(base64, "base64"),
          contentType: "image/webp",
        }),
      );
      await page.reload();
      await page.getByRole("tab", { name: "Folhear catálogo" }).click();
      const img = page.locator(".book-product-photo img");
      await img.evaluate((el: HTMLImageElement) => el.decode());
      await expect
        .poll(async () => {
          const box = await img.boundingBox();
          return Math.abs(box!.width / box!.height - photoWidth / photoHeight);
        })
        .toBeLessThan(0.01);
      await page
        .locator(".book-product-caption")
        .evaluate((el) => el.scrollIntoView({ block: "center" }));
      const photo = (await img.boundingBox())!;
      if (width >= 651 && width <= 1024) {
        expect(photo.height).toBeLessThanOrEqual(
          Math.min(height * 0.44, 460) + 1,
        );
      }
      if (width === 768 && photoWidth === 800) {
        await page.screenshot({ path: "/tmp/catalogo-ipad-mini-square.png" });
      }
      const caption = (await page
        .locator(".book-product-caption")
        .boundingBox())!;
      expect(caption.x).toBeLessThan(photo.x - 10);
      expect(caption.x).toBeGreaterThanOrEqual(0);
      expect(caption.x + caption.width).toBeLessThanOrEqual(width);
      expect(caption.y).toBeLessThan(photo.y + photo.height);
      expect(caption.y + caption.height).toBeGreaterThan(
        photo.y + photo.height,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const add = (await page.locator(".book-add-to-cart").boundingBox())!;
      const price = (await page
        .locator(".book-product .product-price")
        .boundingBox())!;
      expect(
        price.x + price.width <= add.x + 1 ||
          price.y + price.height <= add.y + 1,
      ).toBe(true);
      await page.mouse.click(caption.x + 8, caption.y + caption.height / 2);
      await expect(page.getByRole("dialog")).toBeVisible();
    });
  }
}
