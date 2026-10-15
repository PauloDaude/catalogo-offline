import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

import { prepare, decodeAll } from "./helpers";

const original = JSON.parse(await readFile("public/demo/catalog.json", "utf8"));

const updated = {
  ...original,
  revision: 2,
  products: original.products
    .slice(0, 9)
    .map((p: Record<string, unknown>, i: number) =>
      i === 0
        ? { ...p, priceCents: 6900, imagePath: "photos/panela-v2.jpg" }
        : p,
    ),
};

test("atualiza preço foto e ocultação em duas abas", async ({
  page,
  context,
}) => {
  await prepare(page);
  const second = await context.newPage();
  await second.goto("/");
  await expect(
    second.getByRole("button", { name: "Atualizar catálogo", exact: true }),
  ).toBeEnabled();
  await context.route("**/demo/catalog.json", (route) =>
    route.fulfill({ json: updated }),
  );
  await context.route("**/demo/photos/panela-v2.jpg", async (route) =>
    route.fulfill({
      body: await readFile("public/demo/photos/panela.jpg"),
      contentType: "image/jpeg",
    }),
  );
  await Promise.all([
    page
      .getByRole("button", { name: "Atualizar catálogo", exact: true })
      .click(),
    second
      .getByRole("button", { name: "Atualizar catálogo", exact: true })
      .click(),
  ]);

  for (const tab of [page, second]) {
    await expect(tab.locator(".product-card")).toHaveCount(9);
    await expect(tab.getByText("R$ 69,00", { exact: true })).toBeVisible();
    await decodeAll(tab, 9);
  }
});

test("foto corrompida impede atualização e preserva cópia offline", async ({
  page,
  context,
}) => {
  await prepare(page);
  await context.route("**/demo/catalog.json", (route) =>
    route.fulfill({ json: updated }),
  );
  await context.route("**/demo/photos/panela-v2.jpg", (route) =>
    route.fulfill({ body: "<html>error</html>", contentType: "image/jpeg" }),
  );
  await page
    .getByRole("button", { name: "Atualizar catálogo", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Não foi possível atualizar",
  );
  await expect(page.locator(".product-card")).toHaveCount(10);
  await context.setOffline(true);
  await page.reload();
  await decodeAll(page, 10);
  await expect(page.getByText("R$ 65,00", { exact: true })).toBeVisible();
});
