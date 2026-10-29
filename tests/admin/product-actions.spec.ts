import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
const prefix = process.env.TEST_PREFIX!,
  categoryName = `Ações ${prefix}`;
const client = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
let categoryId: string,
  importedName = `Importado ${prefix}`;
async function choose(page: Page, label: string, option: string) {
  await page
    .locator(".admin-select")
    .getByRole("button", { name: new RegExp(`${label}$`) })
    .click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.locator("[data-exiting]")).toHaveCount(0);
}
async function mark(page: Page, name: string) {
  const checkbox = page.getByRole("checkbox", { name, exact: true });
  await page
    .locator("label.admin-selection-checkbox")
    .filter({ has: checkbox })
    .click();
  await expect(checkbox).toBeChecked();
}
async function login(page: Page) {
  await page.goto("/admin");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.TEST_ADMIN_EMAIL!);
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.TEST_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await choose(page, "Categoria", categoryName);
  await expect(page.locator(".admin-product-row")).toHaveCount(20);
}
test.beforeAll(async () => {
  expect(
    (
      await client.auth.signInWithPassword({
        email: process.env.TEST_ADMIN_EMAIL!,
        password: process.env.TEST_PASSWORD!,
      })
    ).error,
  ).toBeNull();
  const existing = await client
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .maybeSingle();
  if (existing.data) {
    categoryId = existing.data.id;
    return;
  }
  const c = await client
    .from("categories")
    .insert({ name: categoryName })
    .select()
    .single();
  expect(c.error).toBeNull();
  categoryId = c.data.id;
  const image = `products/${crypto.randomUUID()}.jpg`;
  expect(
    (
      await client.storage
        .from("product-photos")
        .upload(image, await readFile("public/demo/photos/panela.jpg"), {
          contentType: "image/jpeg",
        })
    ).error,
  ).toBeNull();
  for (let i = 0; i < 24; i++)
    expect(
      (
        await client.rpc("save_product_v2", {
          p_payload: {
            name: `Lote ${i} ${prefix}`,
            category_id: categoryId,
            image_path: image,
            active: true,
            price_cents: 100,
          },
        })
      ).error,
    ).toBeNull();
  expect(
    (
      await client.rpc("import_product_v2", {
        p_import_key: `actions-browser-${prefix}`,
        p_payload: {
          name: importedName,
          category_id: categoryId,
          image_path: image,
          active: false,
          has_variants: true,
          variant_attribute: "Modelo",
          variants: [{ label: "A", price_cents: 100, active: true }],
        },
      })
    ).error,
  ).toBeNull();
});
for (const viewport of [
  { width: 320, height: 720 },
  { width: 800, height: 1100 },
  { width: 800, height: 360 },
  { width: 1280, height: 900 },
]) {
  test(`rolagem interna preserva filtros e paginação ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await login(page);
    const region = page.getByRole("region", {
      name: "Lista de produtos",
      exact: true,
    });
    await expect(region).toBeVisible();
    for (const control of [
      page.getByLabel("Pesquisar produtos"),
      region,
      page.getByRole("navigation", { name: "Paginação dos produtos" }),
    ]) {
      await expect
        .poll(async () => {
          const box = await control.boundingBox();
          return !!box && box.y >= 0 && box.y + box.height <= viewport.height;
        })
        .toBe(true);
    }
    await mark(page, "Selecionar página");
    for (const control of [
      page.getByLabel("Pesquisar produtos"),
      region,
      page.getByRole("navigation", { name: "Paginação dos produtos" }),
    ]) {
      await expect
        .poll(async () => {
          const box = await control.boundingBox();
          return !!box && box.y >= 0 && box.y + box.height <= viewport.height;
        })
        .toBe(true);
    }
    await page
      .getByRole("button", { name: "Limpar seleção", exact: true })
      .click();
    const filter = await page.getByLabel("Pesquisar produtos").boundingBox();
    const pagination = await page
      .getByRole("navigation", { name: "Paginação dos produtos" })
      .boundingBox();
    await region.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    expect(await region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect((await page.getByLabel("Pesquisar produtos").boundingBox())!.y).toBe(
      filter!.y,
    );
    expect(
      (await page
        .getByRole("navigation", { name: "Paginação dos produtos" })
        .boundingBox())!.y,
    ).toBe(pagination!.y);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/catalogo-acoes-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Próxima", exact: true }).click();
    await expect(page.locator(".admin-product-row")).toHaveCount(5);
    expect(await region.evaluate((el) => el.scrollTop)).toBe(0);
  });
}
test("seleção entre páginas, confirmação, conflito e exclusão do importado", async ({
  page,
}) => {
  await login(page);
  const names = await page
    .locator(".admin-product-info strong")
    .allTextContents();
  const selected = names.filter((n) => n !== importedName).slice(0, 2);
  for (const n of selected) await mark(page, `Selecionar ${n}`);
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  await expect(page.locator(".admin-product-row")).toHaveCount(5);
  const n = (
    await page.locator(".admin-product-info strong").allTextContents()
  )[0];
  selected.push(n);
  await mark(page, `Selecionar ${n}`);
  await expect(page.getByText("3 selecionados", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ocultar selecionados" }).click();
  for (const name of selected)
    await expect(
      page.getByRole("dialog").getByText(name, { exact: false }),
    ).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByText("3 selecionados", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ocultar selecionados" }).click();
  await page
    .getByRole("button", { name: "Ocultar 3 produtos", exact: true })
    .click();
  await expect(
    page.getByText("3 produtos ocultados no servidor", { exact: true }),
  ).toBeVisible();
  await choose(page, "Mostrar", "Ocultos");
  await expect(page.locator(".admin-product-row")).toHaveCount(4);
  await page
    .getByRole("button", { name: `Excluir ${importedName}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("button", { name: `Excluir ${importedName}`, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Excluir definitivamente", exact: true })
    .click();
  await expect(
    page.getByText("Produto excluído definitivamente", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".admin-product-row")).toHaveCount(3);
  await mark(page, "Selecionar página");
  await page
    .getByRole("button", { name: "Mostrar selecionados", exact: true })
    .click();
  await expect(
    page.getByText("3 produtos visíveis no catálogo", { exact: true }),
  ).toBeVisible();
  await choose(page, "Mostrar", "Todos");
  await expect(page.locator(".admin-product-row")).toHaveCount(20);
  const first = (
    await page.locator(".admin-product-info strong").allTextContents()
  )[0];
  await mark(page, `Selecionar ${first}`);
  expect(
    (
      await client
        .from("products")
        .update({ price_cents: 200 })
        .eq("name", first)
    ).error,
  ).toBeNull();
  await page.getByRole("button", { name: "Ocultar selecionados" }).click();
  await page
    .getByRole("button", { name: "Ocultar produto", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Revise a seleção",
  );
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await choose(page, "Mostrar", "Visíveis");
  await expect(page.getByText("1 selecionado", { exact: true })).toHaveCount(0);
});

test("exclusão exige revisão no carrinho e preserva foto compartilhada", async ({
  page,
}) => {
  const name = `Lote 0 ${prefix}`;
  await page.goto("/?visualizacao=cards");
  await page.getByRole("button", { name: categoryName, exact: true }).click();
  await page
    .getByRole("button", { name: `Adicionar ${name} ao carrinho`, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Salvar offline", exact: true })
    .click();
  await expect(
    page.getByText("Catálogo salvo para usar sem internet", { exact: true }),
  ).toBeVisible();
  const row = await client
    .from("products")
    .select("id,version,image_path")
    .eq("name", name)
    .single();
  expect(row.error).toBeNull();
  expect(
    (
      await client.rpc("set_products_visibility", {
        p_items: [{ id: row.data.id, expected_version: row.data.version }],
        p_active: false,
      })
    ).error,
  ).toBeNull();
  const hidden = await client
    .from("products")
    .select("version")
    .eq("id", row.data.id)
    .single();
  expect(
    (
      await client.rpc("remove_product", {
        p_id: row.data.id,
        p_expected_version: hidden.data.version,
      })
    ).error,
  ).toBeNull();
  const photo = await client.storage
    .from("product-photos")
    .download(row.data.image_path);
  expect(photo.error).toBeNull();
  expect(photo.data.size).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Abrir carrinho/ }),
  ).toContainText("Revisar valores");
  await page.getByRole("button", { name: /Abrir carrinho/ }).click();
  await expect(page.getByRole("alert")).toContainText(
    `${name} não está mais disponível`,
  );
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 1,00");
  await page
    .getByRole("button", { name: "Atualizar seleção", exact: true })
    .click();
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 0,00");
  await expect(page.getByText("Indisponível — fora do total")).toBeVisible();
});
