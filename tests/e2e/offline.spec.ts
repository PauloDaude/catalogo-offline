import { test, expect, chromium } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { prepare, decodeAll } from "./helpers";

test("reabre offline com dados, fotos, pesquisa e ampliação", async ({
  page,
  context,
}) => {
  await prepare(page);
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];

    for (const name of await caches.keys())
      for (const request of await (await caches.open(name)).keys())
        urls.push(request.url);

    return urls.filter((u) => u.includes("/demo/"));
  });
  expect(cached).toEqual([]);
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");
  await decodeAll(reopened, 10);
  await expect(reopened.getByRole("status")).toContainText(
    "Os preços podem ter mudado",
  );
  await reopened.getByRole("searchbox").fill("panela");
  await expect(reopened.locator(".product-card")).toHaveCount(1);
  await expect(reopened.getByText("R$ 65,00", { exact: true })).toBeVisible();
  await reopened
    .getByRole("button", { name: "Ver Panela para o dia a dia" })
    .click();
  await expect(reopened.getByRole("dialog")).toBeVisible();
});

test("reabrir navegador preserva catálogo offline no perfil", async () => {
  const profile = await mkdtemp(join(tmpdir(), "catalogo-profile-"));
  let context = await chromium.launchPersistentContext(profile, {
    baseURL: "http://127.0.0.1:4173",
  });

  try {
    await prepare(await context.newPage());
    await context.close();
    context = await chromium.launchPersistentContext(profile, {
      offline: true,
      baseURL: "http://127.0.0.1:4173",
    });
    const page = await context.newPage();
    await page.goto("/");
    await decodeAll(page, 10);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test("shell sem catálogo preparado explica primeira abertura sem rede", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("status")).toContainText("Conecte-se à internet");
});
