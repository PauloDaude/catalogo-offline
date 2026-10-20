import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
const email = process.env.TEST_ADMIN_EMAIL!,
  password = process.env.TEST_PASSWORD!,
  prefix = process.env.TEST_PREFIX!;

test("visitante, conta sem autorização e logout", async ({ page }) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Entrar no painel" }),
  ).toBeVisible();
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByText("Esta conta não tem acesso ao painel.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Adicionar produto" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Entrar no painel" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(
    page.getByText(
      "Se este email tiver uma conta, você receberá um link para recuperar a senha.",
    ),
  ).toBeVisible();
  const messageId = async () => {
    const result = await fetch("http://127.0.0.1:54324/api/v1/messages");
    const body = await result.json();
    return (
      body.messages.find((m: { To: Array<{ Address: string }> }) =>
        m.To.some((recipient) => recipient.Address === email),
      )?.ID ?? ""
    );
  };
  await expect.poll(messageId).not.toBe("");
  const body = await (
    await fetch(`http://127.0.0.1:54324/api/v1/message/${await messageId()}`)
  ).json();
  const link = String(body.HTML)
    .match(/href="([^"]*\/auth\/v1\/verify[^"]*)"/)?.[1]
    ?.replaceAll("&amp;", "&");
  expect(link).toBeTruthy();
  await page.goto(link!);
  await expect(
    page.getByRole("heading", { name: "Definir nova senha" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Nova senha (mínimo 12 caracteres)"),
  ).toBeVisible();
});

for (const viewport of [
  { width: 320, height: 720 },
  { width: 360, height: 800 },
  { width: 800, height: 1100 },
  { width: 1280, height: 900 },
  { width: 800, height: 360 },
]) {
  test(`gerenciar produtos e categorias ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const category = `Teste ${viewport.width}x${viewport.height} ${prefix}`;
    await page.goto("/admin");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.getByRole("button", { name: "Categorias", exact: true }).click();
    await page.getByLabel("Nome da categoria", { exact: true }).fill(category);
    await page.getByRole("button", { name: "Criar categoria" }).click();
    await expect(page.getByText("Categoria salva no servidor.")).toBeVisible();
    await page.getByRole("button", { name: "Produtos", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar produto" }).click();
    await page.getByLabel("Nome do produto").fill("Produto especial");
    await page
      .getByRole("combobox", { name: "Categoria", exact: true })
      .selectOption({ label: category });
    await page.getByLabel("Preço atual (R$)").fill("65,00");
    await page.getByText("Produto em oferta", { exact: true }).click();
    await expect(
      page.getByRole("checkbox", { name: "Produto em oferta" }),
    ).toBeChecked();
    await page.getByLabel("Preço anterior (R$)").fill("100,00");
    await expect(page.getByText("35% de desconto")).toBeVisible();
    await page
      .getByLabel("Foto do produto", { exact: true })
      .setInputFiles(path.resolve("public/demo/photos/panela.jpg"));
    await expect(
      page.getByRole("img", { name: "Prévia da foto do produto" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Salvar produto" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Salvar produto" }).click();
    await expect(
      page.getByText("Produto salvo no servidor.", { exact: false }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Categoria", exact: true })
      .selectOption({ label: category });
    await expect(
      page.getByText("Produto especial", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Editar Produto especial" }).click();
    await page.getByLabel("Nome do produto").fill("Nome atualizado");
    await page.getByLabel("Preço atual (R$)").fill("70,00");
    await page
      .getByLabel("Trocar foto", { exact: true })
      .setInputFiles(path.resolve("public/demo/photos/garrafa.jpg"));
    await expect(
      page.getByRole("button", { name: "Salvar produto" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Salvar produto" }).click();
    await expect(
      page.getByText("Nome atualizado", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Categorias", exact: true }).click();
    await page
      .getByRole("button", { name: `Arquivar ${category}`, exact: true })
      .click();
    await expect(
      page.getByText("Mova ou oculte estes produtos antes de arquivar:"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Produtos", exact: true }).click();
    await page
      .getByRole("button", { name: "Ocultar Nome atualizado", exact: true })
      .click();
    await expect(page.getByText("Produto ocultado no servidor.")).toBeVisible();
    await page
      .getByRole("combobox", { name: "Mostrar", exact: true })
      .selectOption("hidden");
    await expect(
      page.getByText("Nome atualizado", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Mostrar novamente Nome atualizado",
        exact: true,
      })
      .click();
    await expect(page.getByText("Produto visível no catálogo.")).toBeVisible();
    await page
      .getByRole("combobox", { name: "Mostrar", exact: true })
      .selectOption("active");
    await page
      .getByRole("button", { name: "Ocultar Nome atualizado", exact: true })
      .click();
    await expect(page.getByText("Produto ocultado no servidor.")).toBeVisible();
    await page.getByRole("button", { name: "Categorias", exact: true }).click();
    await page
      .getByRole("button", { name: `Renomear ${category}`, exact: true })
      .click();
    const renamed = `${category} nova`;
    await page
      .getByLabel("Novo nome da categoria", { exact: true })
      .fill(renamed);
    await page
      .getByRole("button", { name: "Salvar nome", exact: true })
      .click();
    await expect(page.getByText("Categoria salva no servidor.")).toBeVisible();
    await page
      .getByRole("button", { name: `Arquivar ${renamed}`, exact: true })
      .click();
    await expect(
      page.getByText("Categoria arquivada.", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Reativar ${renamed}`, exact: true })
      .click();
    await expect(
      page.getByText("Categoria reativada.", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `.superpowers/sdd/2026-10-20-painel-administrativo/admin-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Entrar no painel" }),
    ).toBeVisible();
  });
}

test("conflito de edição conserva o formulário", async ({ page }) => {
  const client = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  await client.auth.signInWithPassword({ email, password });
  const categoryResult = await client
    .from("categories")
    .insert({ name: `Conflito ${prefix}` })
    .select()
    .single();
  expect(categoryResult.error).toBeNull();
  const p = await client.rpc("save_product", {
    p_id: null,
    p_expected_version: null,
    p_name: "Concorrente",
    p_category_id: categoryResult.data.id,
    p_price_cents: 100,
    p_previous_price_cents: null,
    p_image_path: (
      await client.from("products").select("image_path").limit(1).single()
    ).data!.image_path,
    p_active: true,
  });
  expect(p.error).toBeNull();
  await page.goto("/admin");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Editar Concorrente" }).click();
  await page.getByLabel("Nome do produto").fill("Minha edição");
  await client
    .from("products")
    .update({ name: "Edição externa" })
    .eq("id", p.data.id);
  await page.getByRole("button", { name: "Salvar produto" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Este produto foi alterado",
  );
  await expect(page.getByLabel("Nome do produto")).toHaveValue("Minha edição");
  await expect(
    page.getByRole("button", { name: "Salvar produto" }),
  ).toBeDisabled();
  await client.auth.signOut();
});

test("fonte Supabase pública salva fotos e categorias novas para reabrir offline", async ({
  page,
  context,
}) => {
  const client = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  await client.auth.signInWithPassword({ email, password });
  const category = `Offline ${prefix}`;
  const c = await client
    .from("categories")
    .insert({ name: category })
    .select()
    .single();
  expect(c.error).toBeNull();
  const imagePath = `products/${crypto.randomUUID()}.jpg`;
  const bytes = (await import("node:fs")).readFileSync(
    path.resolve("public/demo/photos/panela.jpg"),
  );
  expect(
    (
      await client.storage
        .from("product-photos")
        .upload(imagePath, bytes, { contentType: "image/jpeg" })
    ).error,
  ).toBeNull();
  const args = {
    p_id: null,
    p_expected_version: null,
    p_name: "Produto remoto offline",
    p_category_id: c.data.id,
    p_price_cents: 6500,
    p_previous_price_cents: 10000,
    p_image_path: imagePath,
    p_active: true,
  };
  expect((await client.rpc("save_product", args)).error).toBeNull();
  expect(
    (
      await client.rpc("save_product", {
        ...args,
        p_name: "Oculto remoto",
        p_active: false,
      })
    ).error,
  ).toBeNull();
  await page.goto("/?visualizacao=cards");
  await page.getByRole("button", { name: category, exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.getByText("Oculto remoto")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Salvar offline", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Catálogo salvo para usar sem internet",
    { timeout: 20000 },
  );
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: category, exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  const image = page.locator(".product-card img");
  await expect
    .poll(() =>
      image.evaluate(
        (img: HTMLImageElement) =>
          img.complete && img.naturalWidth > 0 && img.src.startsWith("blob:"),
      ),
    )
    .toBe(true);
  await context.setOffline(false);
  await client.auth.signOut();
});
