import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  loadConfig,
  createApi,
  importPilot,
  ImportError,
} from "./catalog-import.mjs";
import { validateFullManifest } from "./full-manifest.mjs";
import { verifyBackup } from "../backup/manifest.mjs";
const root = process.cwd();
const hash = (value) => createHash("sha256").update(value).digest("hex");

export async function ensureCategories(client, manifest) {
  const wanted = [...new Set(manifest.produtos.map((p) => p.categoria))];
  const result = await client
    .from("categories")
    .select("id,name,active")
    .in("name", wanted);
  if (result.error)
    throw new ImportError("Não foi possível conferir categorias");
  for (const name of wanted) {
    const matches = result.data.filter((c) => c.name === name);
    if (matches.length > 1)
      throw new ImportError(
        "Nome de categoria duplicado, revise antes de importar",
      );
    if (matches.length && !matches[0].active)
      throw new ImportError("Categoria arquivada, revise antes de importar");
    if (!matches.length) {
      const created = await client.from("categories").insert({ name });
      if (created.error)
        throw new ImportError(
          "Não foi possível criar categoria, confira autorização",
        );
    }
  }
}
export async function runFull(mode) {
  process.umask(0o077);
  const manifest = JSON.parse(
    await readFile(
      path.join(root, "docs/produtos/lote-completo-20261029.json"),
      "utf8",
    ),
  );
  const summary = await validateFullManifest(manifest, root);
  if (mode === "--dry-run") {
    console.log(JSON.stringify(summary));
    return;
  }
  if (!["--check", "--full", "--verify"].includes(mode))
    throw new ImportError("Use --dry-run, --check, --full ou --verify");
  const config = await loadConfig();
  if (!config.IMPORT_BACKUP_DIR)
    throw new ImportError("Configure backup V2 real");
  const backup = await verifyBackup(
    path.resolve(root, config.IMPORT_BACKUP_DIR),
  );
  if (backup.origin !== config.origin || backup.version !== 2)
    throw new ImportError("Backup deve ser V2 do mesmo projeto");
  const client = createClient(config.origin, config.IMPORT_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const login = await client.auth.signInWithPassword({
      email: config.IMPORT_ADMIN_EMAIL,
      password: config.IMPORT_ADMIN_PASSWORD,
    });
    if (login.error)
      throw new ImportError("Falha no login administrativo configurado");
    const admin = await client.rpc("is_catalog_admin");
    if (admin.error || admin.data !== true)
      throw new ImportError("Conta não autorizada");
    const current = await client.rpc("list_admin_products_v2", {
      p_page: 1,
      p_query: "",
      p_visibility: "all",
    });
    if (current.error) throw new ImportError("Backend V2 indisponível");
    const journalDir = path.join(
      root,
      ".catalog-import",
      hash(config.origin).slice(0, 16),
      manifest.lote,
    );
    let journal;
    try {
      journal = JSON.parse(
        await readFile(path.join(journalDir, "journal.json"), "utf8"),
      );
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    if (current.data.total > 0 && !journal)
      throw new ImportError(
        "Banco contém produtos sem journal deste lote, não importar automaticamente",
      );
    if (
      journal &&
      (journal.origin !== config.origin ||
        journal.manifestHash !== hash(JSON.stringify(manifest)))
    )
      throw new ImportError("Journal não corresponde ao manifesto");
    if (mode === "--check") {
      const cats = await client.from("categories").select("id,name,active");
      if (cats.error)
        throw new ImportError("Falha na leitura administrativa de categorias");
      console.log(
        JSON.stringify({
          ...summary,
          existingProducts: current.data.total,
          existingCategories: cats.data.length,
          backupVerified: true,
          administrator: true,
        }),
      );
      return;
    }
    if (mode === "--full") {
      await ensureCategories(client, manifest);
      const saved = await importPilot({
        root,
        manifest,
        journalDir,
        origin: config.origin,
        api: createApi(client, manifest),
        prepare: async (source) => ({
          bytes: await readFile(path.join(root, "docs/produtos", source)),
        }),
      });
      console.log(
        `Lote enviado e retornos conferidos: ${saved.length} produtos`,
      );
    }
    // Independent administrative reads, no mutation or reuse of RPC return values.
    const products = await client.from("products").select("*");
    const variants = await client.from("product_variants").select("*");
    const categories = await client.from("categories").select("id,name,active");
    if (products.error || variants.error || categories.error)
      throw new ImportError("Falha na conferência administrativa independente");
    journal = JSON.parse(
      await readFile(path.join(journalDir, "journal.json"), "utf8"),
    );
    const ids = new Set();
    const photoPaths = new Set();
    let choices = 0;
    for (const entry of manifest.produtos) {
      const saved = journal.completed[entry.chave_importacao];
      const p = products.data.find((r) => r.id === saved?.id);
      if (
        !p ||
        p.name !== entry.nome ||
        p.active !== entry.ativo ||
        p.has_variants !== entry.tem_variantes ||
        categories.data.find((c) => c.id === p.category_id)?.name !==
          entry.categoria
      )
        throw new ImportError(
          "Produto diverge do manifesto na leitura independente",
        );
      ids.add(p.id);
      photoPaths.add(p.image_path);
      const actual = entry.tem_variantes
        ? variants.data.filter((v) => v.product_id === p.id)
        : [p];
      const expected = entry.tem_variantes ? entry.variantes : [entry];
      if (actual.length !== expected.length)
        throw new ImportError("Quantidade de opções divergente");
      for (const row of expected) {
        const a = entry.tem_variantes
          ? actual.find((v) => v.label === row.rotulo)
          : p;
        const sourceBytes = await readFile(
          path.join(root, "docs/produtos", row.imagem),
        );
        const asset = journal.assets[hash(sourceBytes)];
        if (
          !a ||
          a.price_cents !== row.preco_centavos ||
          a.previous_price_cents !== null ||
          a.sale_kind !== (row.venda.tipo === "caixa" ? "box" : "unit") ||
          a.pack_count !== (row.venda.embalagens_por_caixa || 1) ||
          a.units_per_pack !== (row.venda.unidades_por_embalagem || 1) ||
          a.image_path !== asset?.path ||
          (entry.tem_variantes && !a.active)
        )
          throw new ImportError(
            "Preço, caixa, foto ou opção diverge dos dados comerciais",
          );
        photoPaths.add(a.image_path);
        choices++;
      }
    }
    const publicClient = createClient(
      config.origin,
      config.IMPORT_PUBLISHABLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const snapshot = await publicClient.rpc("read_catalog_snapshot_v2");
    if (snapshot.error) throw new ImportError("Falha na conferência pública");
    const publicRows = snapshot.data.products;
    const expectedPublic = manifest.produtos[0].ativo
      ? manifest.produtos.length
      : 0;
    if (publicRows.filter((p) => ids.has(p.id)).length !== expectedPublic)
      throw new ImportError("Visibilidade pública divergente");
    for (const name of photoPaths) {
      const response = await publicClient.storage
        .from("product-photos")
        .download(name);
      const expected = Object.values(journal.assets).find(
        (a) => a.path === name,
      );
      if (
        response.error ||
        response.data.type.split(";")[0] !== "image/webp" ||
        hash(Buffer.from(await response.data.arrayBuffer())) !==
          expected?.sha256
      )
        throw new ImportError("Foto pública não corresponde aos bytes WebP");
    }
    const evidence = {
      ...summary,
      productsVerified: ids.size,
      choicesVerified: choices,
      photosVerified: photoPaths.size,
      publicProducts: expectedPublic,
      remoteTotal: products.data.length,
      verifiedAt: new Date().toISOString(),
    };
    await mkdir(journalDir, { recursive: true, mode: 0o700 });
    await writeFile(
      path.join(journalDir, "verification.json"),
      JSON.stringify(evidence, null, 2),
      { mode: 0o600 },
    );
    console.log(JSON.stringify(evidence));
  } finally {
    await client.auth.signOut().catch(() => {});
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  runFull(process.argv[2]).catch((error) => {
    console.error(
      error instanceof ImportError
        ? error.message
        : "Lote não concluído: confira pré-requisitos, manifesto e journal, sem apagar registros de retomada",
    );
    process.exitCode = 1;
  });
}
