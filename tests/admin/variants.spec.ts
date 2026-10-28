import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { execFileSync } from "node:child_process";
async function choose(
  page: import("@playwright/test").Page,
  label: string,
  option: string,
) {
  await page.getByRole("button", { name: new RegExp(`${label}$`) }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.locator("[data-exiting]")).toHaveCount(0);
}
const email = process.env.TEST_ADMIN_EMAIL!,
  password = process.env.TEST_PASSWORD!,
  prefix = process.env.TEST_PREFIX!;
for (const width of [320, 360, 768, 800, 1024, 1280]) {
  test(`variantes e caixas no painel e carrinho ${width}`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const client = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    await client.auth.signInWithPassword({ email, password });
    const category = `Opções ${width} ${prefix}`;
    const c = await client
      .from("categories")
      .insert({ name: category })
      .select()
      .single();
    expect(c.error).toBeNull();
    await page.goto("/admin");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar produto" }).click();
    await page.getByLabel("Nome do produto").fill(`Processador ${width}`);
    await choose(page, "Categoria", category);
    await page
      .locator(
        ".product-form > .photo-dropzone input[type=file], .product-form > div input[type=file]",
      )
      .first()
      .setInputFiles(path.resolve("public/demo/photos/panela.jpg"));
    await choose(page, "Tipo de produto", "Produto com variantes");
    await page.getByLabel("Característica", { exact: true }).fill("Capacidade");
    await page.getByLabel("Nome da opção 1", { exact: true }).fill("500 ml");
    await page
      .getByLabel("Preço da opção 1 (R$)", { exact: true })
      .fill("14,90");
    await page.getByLabel("Nome da opção 2", { exact: true }).fill("900 ml");
    await page
      .getByLabel("Preço da opção 2 (R$)", { exact: true })
      .fill("21,90");
    await choose(page, "Unidade de venda da opção 2", "Caixa / pacote");
    await page
      .getByLabel("Quantidade de conjuntos da opção 2", { exact: true })
      .fill("12");
    await page
      .getByRole("button", { name: "Salvar produto", exact: true })
      .click();
    await expect(
      page.getByText("Produto salvo no servidor", { exact: false }),
    ).toBeVisible();
    await page.goto("/?visualizacao=cards");
    await page.getByRole("button", { name: category, exact: true }).click();
    await expect(page.locator(".product-card")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByText("A partir de")).toBeVisible();
    await page
      .getByRole("button", { name: `Escolher opções de Processador ${width}` })
      .click();
    await expect(
      page.getByRole("button", { name: "Adicionar ao carrinho" }),
    ).toBeDisabled();
    await choose(page, "Capacidade", "500 ml — R$ 14,90");
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await choose(page, "Capacidade", "900 ml — R$ 21,90");
    await expect(
      page.getByText("Caixa com 12 unidades", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await page.getByRole("button", { name: /Abrir carrinho/ }).click();
    await expect(
      page.getByText(`Processador ${width} — 500 ml`, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(`Processador ${width} — 900 ml — Caixa com 12 unidades`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".cart-total")).toContainText("36,80");
    await page.screenshot({
      path: `/tmp/catalogo-variantes-cart-${width}.png`,
      fullPage: true,
    });
    if (width === 360) {
      await page
        .getByRole("button", { name: "Gerar pedido em PDF", exact: true })
        .click();
      await page
        .getByLabel("Nome do cliente", { exact: true })
        .fill("Cliente das variantes");
      await page
        .getByRole("button", { name: "Gerar PDF", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Pedido pronto" }),
      ).toBeVisible({ timeout: 20000 });
      await expect(
        page.getByAltText("Prévia do topo da primeira página do pedido PDF"),
      ).toBeVisible();
      const downloading = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Baixar PDF", exact: true })
        .click();
      const pdf = await downloading;
      const file = "/tmp/catalogo-pedido-variantes.pdf";
      await pdf.saveAs(file);
      const text = execFileSync("pdftotext", [file, "-"], {
        encoding: "utf8",
      });
      expect(text).toContain("500 ml");
      expect(text).toContain("900 ml");
      expect(text.replace(/\s+/g, " ")).toContain("Caixa com 12 unidades");
      expect(text).toContain("R$ 36,80");
      await page.getByRole("button", { name: "Voltar ao carrinho" }).click();
    }
    await page.getByRole("button", { name: "Fechar", exact: true }).click();
    await page
      .getByRole("button", { name: "Salvar offline", exact: true })
      .click();
    await expect(
      page.getByText("Catálogo salvo para usar sem internet", { exact: true }),
    ).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("button", { name: category, exact: true }).click();
    await page
      .getByRole("button", { name: `Escolher opções de Processador ${width}` })
      .click();
    await choose(page, "Capacidade", "900 ml — R$ 21,90");
    await expect(
      page.getByRole("button", { name: "Adicionar ao carrinho" }),
    ).toBeEnabled();
    await expect(
      page.getByText("Caixa com 12 unidades", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `/tmp/catalogo-variantes-modal-${width}.png`,
      fullPage: true,
    });
    await context.setOffline(false);
    await client.auth.signOut();
  });
}
