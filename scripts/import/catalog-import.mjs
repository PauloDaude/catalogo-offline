import {
  readFile,
  writeFile,
  mkdir,
  lstat,
  rename,
  unlink,
  chmod,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { verifyBackup } from "../backup/manifest.mjs";
class ImportError extends Error {}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const allowedKeys = ["canivete", "processador", "pano", "coador", "funil"].map(
  (n) => `piloto-variantes-v1:${n}`,
);
const sale = (p) => ({
  sale_kind: p.venda.tipo === "caixa" ? "box" : "unit",
  pack_count: p.venda.embalagens_por_caixa || 1,
  units_per_pack: p.venda.unidades_por_embalagem || 1,
});
function checkRow(row) {
  if (
    !Number.isSafeInteger(row.preco_centavos) ||
    row.preco_centavos < 0 ||
    row.preco_centavos > 999999999 ||
    (row.preco_anterior_centavos != null &&
      (!Number.isSafeInteger(row.preco_anterior_centavos) ||
        row.preco_anterior_centavos <= row.preco_centavos))
  )
    throw new ImportError("Preço ou oferta inválidos no piloto");
  const s = sale(row);
  if (
    !["unidade", "caixa"].includes(row.venda.tipo) ||
    !Number.isInteger(s.pack_count) ||
    !Number.isInteger(s.units_per_pack) ||
    s.pack_count < 1 ||
    s.units_per_pack < 1 ||
    s.pack_count * s.units_per_pack > 100000
  )
    throw new ImportError("Unidade de venda inválida");
}
export async function loadPilot(root = projectRoot) {
  const manifest = JSON.parse(
    await readFile(
      path.join(root, "docs/produtos/piloto-variantes.json"),
      "utf8",
    ),
  );
  if (
    manifest.produtos?.length !== 5 ||
    new Set(manifest.produtos.map((p) => p.chave_importacao)).size !== 5 ||
    !manifest.produtos.every(
      (p) =>
        allowedKeys.includes(p.chave_importacao) &&
        p.ativo === false &&
        p.nome?.trim() &&
        p.categoria?.trim(),
    )
  )
    throw new ImportError(
      "O comando aceita somente os cinco produtos ocultos do piloto aprovado",
    );
  let choices = 0;
  for (const p of manifest.produtos) {
    const rows = p.tem_variantes ? p.variantes : [p];
    choices += rows.length;
    if (
      p.tem_variantes &&
      (!p.caracteristica ||
        new Set(rows.map((v) => v.rotulo)).size !== rows.length)
    )
      throw new ImportError("Opções inválidas no piloto");
    for (const row of rows) {
      checkRow(row);
      if (!/^imagens\/IMG-\d{8}-WA\d{4}\.jpg$/.test(row.imagem))
        throw new ImportError("Imagem fora da pasta autorizada");
      const stat = await lstat(path.join(root, "docs/produtos", row.imagem));
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        stat.size > 20 * 1024 * 1024
      )
        throw new ImportError("Foto ausente ou inválida");
    }
  }
  if (choices !== 8)
    throw new ImportError("O piloto deve conter oito itens de compra");
  return manifest;
}
export async function buildPayload(p, categories, resolvePhoto) {
  const category = categories.get(p.categoria);
  if (!category)
    throw new ImportError(
      "Categoria do piloto ausente ou arquivada, confira o mapeamento",
    );
  const base = {
    name: p.nome,
    category_id: category,
    image_path: await resolvePhoto(p.imagem),
    active: false,
    has_variants: p.tem_variantes,
  };
  if (!p.tem_variantes)
    return {
      ...base,
      ...sale(p),
      price_cents: p.preco_centavos,
      previous_price_cents: p.preco_anterior_centavos ?? null,
    };
  const variants = [];
  for (const row of p.variantes)
    variants.push({
      label: row.rotulo,
      price_cents: row.preco_centavos,
      previous_price_cents: row.preco_anterior_centavos ?? null,
      image_path: await resolvePhoto(row.imagem),
      active: true,
      ...sale(row),
    });
  return { ...base, variant_attribute: p.caracteristica, variants };
}
async function privateDir(folder) {
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const stat = await lstat(folder);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new ImportError("Journal não pode ser um link simbólico");
  await chmod(folder, 0o700);
}
async function saveJournal(file, data) {
  const temp = file + ".tmp-" + randomUUID();
  await writeFile(temp, JSON.stringify(data, null, 2), {
    mode: 0o600,
    flag: "wx",
  });
  await rename(temp, file);
}
export async function importPilot({
  root = projectRoot,
  journalDir = path.join(root, ".catalog-import"),
  manifest,
  api,
  prepare,
  verify = true,
  origin = "test-local",
}) {
  await privateDir(journalDir);
  const lock = path.join(journalDir, "running.lock");
  try {
    await writeFile(lock, "Em execução", { flag: "wx", mode: 0o600 });
  } catch {
    throw new ImportError(
      "Uma importação já está em execução, confira o processo antes de remover running.lock",
    );
  }
  try {
    const file = path.join(journalDir, "journal.json"),
      digest = hash(JSON.stringify(manifest));
    let journal;
    try {
      const stat = await lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.mode & 0o077)
        throw new ImportError("Journal inseguro");
      journal = JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      journal = { origin, manifestHash: digest, assets: {}, completed: {} };
    }
    if (journal.origin !== origin)
      throw new ImportError("O journal pertence a outro projeto");
    if (journal.manifestHash !== digest)
      throw new ImportError(
        "O manifesto mudou desde a primeira tentativa, revise o journal antes de continuar",
      );
    const categories = await api.categories();
    for (const p of manifest.produtos)
      if (!categories.has(p.categoria))
        throw new ImportError("Categoria ausente ou arquivada");
    const cache = new Map();
    const resolvePhoto = async (source) => {
      if (cache.has(source)) return cache.get(source);
      const raw = await readFile(path.join(root, "docs/produtos", source)),
        key = hash(raw);
      if (!journal.assets[key]) {
        journal.assets[key] = { path: `products/${randomUUID()}.jpg` };
        await saveJournal(file, journal);
      }
      const asset = journal.assets[key];
      const prepared = await prepare(source, key, asset.path);
      const bytes = prepared.bytes;
      if (asset.sha256 && asset.sha256 !== hash(bytes))
        throw new ImportError(
          "A preparação da foto mudou, confira versões e journal antes de repetir",
        );
      asset.sha256 = hash(bytes);
      await saveJournal(file, journal);
      await api.photo(asset.path, bytes);
      cache.set(source, asset.path);
      return asset.path;
    };
    const result = [];
    for (const p of manifest.produtos) {
      {
        const payload = await buildPayload(p, categories, resolvePhoto);
        const saved = await api.save(p.chave_importacao, payload);
        if (verify && !matchesPayload(saved, payload))
          throw new ImportError(
            "O servidor retornou um produto diferente do piloto",
          );
        journal.completed[p.chave_importacao] = {
          id: saved.id,
          code: saved.code,
          variants: (saved.variants || []).map((v) => ({
            id: v.id,
            code: v.code,
            label: v.label,
            price_cents: v.price_cents,
          })),
        };
        await saveJournal(file, journal);
      }
      result.push(journal.completed[p.chave_importacao]);
    }
    return result;
  } finally {
    await unlink(lock).catch(() => {});
  }
}
function matchesPayload(saved, payload) {
  const common = [
    "name",
    "category_id",
    "image_path",
    "active",
    "has_variants",
  ];
  if (!common.every((key) => saved[key] === payload[key])) return false;
  const fields = [
    "price_cents",
    "previous_price_cents",
    "sale_kind",
    "pack_count",
    "units_per_pack",
  ];
  const same = (a, b) =>
    fields.every((key) => (a[key] ?? null) === (b[key] ?? null));
  if (!payload.has_variants) return same(saved, payload);
  if (saved.variants?.length !== payload.variants.length) return false;
  return payload.variants.every((v) => {
    const row = saved.variants.find((r) => r.label === v.label);
    return (
      row &&
      same(row, v) &&
      row.image_path === v.image_path &&
      row.active === v.active
    );
  });
}
async function loadConfig() {
  const file = path.join(projectRoot, ".env.import");
  let local;
  try {
    const stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.mode & 0o077)
      throw new ImportError("Execute chmod 600 .env.import");
    local = parseEnv(await readFile(file, "utf8"));
  } catch (error) {
    if (error instanceof ImportError) throw error;
    throw new ImportError(
      "Configure .env.import localmente antes do envio, sem colocar senhas no chat",
    );
  }
  for (const key of [
    "IMPORT_SUPABASE_URL",
    "IMPORT_PUBLISHABLE_KEY",
    "IMPORT_ADMIN_EMAIL",
    "IMPORT_ADMIN_PASSWORD",
  ])
    if (!local[key]) throw new ImportError(`Configure ${key} localmente`);
  const url = new URL(local.IMPORT_SUPABASE_URL);
  const isLocal = url.hostname === "127.0.0.1";
  if (
    (url.protocol !== "https:" && !isLocal) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new ImportError("URL do Supabase inválida");
  return { ...local, isLocal, origin: url.origin };
}
function createApi(client, manifest) {
  return {
    categories: async () => {
      const { data, error } = await client
        .from("categories")
        .select("id,name")
        .eq("active", true)
        .in("name", [...new Set(manifest.produtos.map((p) => p.categoria))]);
      if (error) throw new ImportError("Não foi possível conferir categorias");
      return new Map(data.map((c) => [c.name, c.id]));
    },
    photo: async (path, bytes) => {
      const check = await client.storage.from("product-photos").download(path);
      if (!check.error) {
        if (hash(Buffer.from(await check.data.arrayBuffer())) !== hash(bytes))
          throw new ImportError(
            "Foto existente difere da importação, não será sobrescrita",
          );
        return;
      }
      if (
        !["400", "404", "NoSuchKey"].includes(
          String(
            check.error.statusCode || check.error.status || check.error.code,
          ),
        )
      )
        throw new ImportError(
          "Não foi possível conferir a foto no Storage, tente novamente",
        );
      const result = await client.storage
        .from("product-photos")
        .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
      if (result.error) {
        const retry = await client.storage
          .from("product-photos")
          .download(path);
        if (
          retry.error ||
          hash(Buffer.from(await retry.data.arrayBuffer())) !== hash(bytes)
        )
          throw new ImportError(
            "Envio da foto não confirmado, repita com o mesmo journal",
          );
      }
    },
    save: async (key, payload) => {
      const { data, error } = await client.rpc("import_product_v2", {
        p_import_key: key,
        p_payload: payload,
      });
      if (error)
        throw new ImportError(
          "Cadastro não confirmado, confira a migration, autorização e conexão, repita com o mesmo journal",
        );
      return data;
    },
  };
}
export async function runConfiguredPilot(
  config,
  manifest,
  { journalDir } = {},
) {
  if (!config.isLocal) {
    if (!config.IMPORT_BACKUP_DIR)
      throw new ImportError(
        "Gere e confira um backup real após a migration e configure IMPORT_BACKUP_DIR",
      );
    const backup = await verifyBackup(
      path.resolve(projectRoot, config.IMPORT_BACKUP_DIR),
    );
    if (backup.origin !== config.origin || backup.version !== 2)
      throw new ImportError(
        "Use um backup V2 do mesmo projeto, gerado após a migration de variantes",
      );
  }
  const client = createClient(config.origin, config.IMPORT_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const login = await client.auth.signInWithPassword({
      email: config.IMPORT_ADMIN_EMAIL,
      password: config.IMPORT_ADMIN_PASSWORD,
    });
    if (login.error)
      throw new ImportError(
        "Não foi possível entrar com a conta local configurada",
      );
    const admin = await client.rpc("is_catalog_admin");
    if (admin.error || !admin.data)
      throw new ImportError(
        "A conta configurada não é administradora autorizada",
      );
    const version = await client.rpc("list_admin_products_v2", {
      p_page: 1,
      p_query: "",
      p_visibility: "all",
    });
    if (version.error)
      throw new ImportError("Aplique a migration 005 antes do piloto");
    await privateDir(path.join(projectRoot, ".catalog-import"));
    return await importPilot({
      manifest,
      root: projectRoot,
      origin: config.origin,
      journalDir:
        journalDir ||
        path.join(
          projectRoot,
          ".catalog-import",
          hash(config.origin).slice(0, 16),
        ),
      api: createApi(client, manifest),
      prepare: async (source) => {
        try {
          return {
            bytes: execFileSync(
              "python3",
              [
                path.join(projectRoot, "scripts/import/optimize-photo.py"),
                path.join(projectRoot, "docs/produtos", source),
              ],
              { maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
            ),
          };
        } catch {
          throw new ImportError(
            "Não foi possível preparar a foto, confira Python/Pillow e o arquivo original",
          );
        }
      },
    });
  } finally {
    await client.auth.signOut().catch(() => {});
  }
}
async function main() {
  process.umask(0o077);
  const args = process.argv.slice(2);
  if (args.length !== 1 || !["--dry-run", "--pilot"].includes(args[0]))
    throw new ImportError("Use npm run import:catalog -- --dry-run ou --pilot");
  const manifest = await loadPilot();
  if (args[0] === "--dry-run") {
    console.log(
      "Simulação conferida: 5 produtos principais, 8 itens de compra, todos ocultos\nNenhuma requisição de escrita, credencial ou upload utilizado",
    );
    return;
  }
  const config = await loadConfig();
  const result = await runConfiguredPilot(config, manifest);
  console.log(
    `Piloto conferido: ${result.length} produtos principais ocultos\nCódigos: ${result.map((p) => p.code).join(", ")}\nNão ative a oferta demonstrativa como preço comercial sem revisão`,
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  main().catch((error) => {
    console.error(
      error instanceof ImportError
        ? error.message
        : "A importação não concluiu, confira configuração e journal local, nenhum segredo foi registrado",
    );
    process.exitCode = 1;
  });
