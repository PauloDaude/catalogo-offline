import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildFullManifest, validateFullManifest } from "./full-manifest.mjs";
import { buildPayload, importPilot } from "./catalog-import.mjs";
const source = JSON.parse(
  await readFile("docs/produtos/produtos-preparados.json", "utf8"),
);

test("lote cobre 85 origens uma vez, seis categorias e não reaplica oferta fictícia", async () => {
  const m = buildFullManifest(source, true);
  await validateFullManifest(m);
  const rows = m.produtos.flatMap((p) => (p.tem_variantes ? p.variantes : [p]));
  assert.equal(rows.length, 85);
  assert.equal(new Set(rows.map((r) => r.origens[0])).size, 85);
  assert.equal(new Set(m.produtos.map((p) => p.categoria)).size, 6);
  assert.ok(m.produtos.every((p) => p.ativo));
  for (const r of rows) {
    const original = source.produtos.find(
      (p) => p.id_importacao === r.origens[0],
    );
    assert.equal(r.preco_centavos, original.preco_centavos);
    assert.deepEqual(r.venda, original.venda);
    assert.equal(r.imagem, original.imagem);
    assert.equal(r.preco_anterior_centavos, null);
  }
  assert.equal(
    rows.find((r) => r.origens[0] === "WA0594-01").preco_centavos,
    2990,
  );
  const cats = new Map(m.produtos.map((p) => [p.categoria, p.categoria]));
  const coador = m.produtos.find((p) => p.nome === "Coador para café");
  const payload = await buildPayload(
    coador,
    cats,
    async () => "products/photo.webp",
  );
  assert.deepEqual(
    payload.variants.map((v) => v.price_cents),
    [3180, 3060, 2940],
  );
  assert.equal(payload.active, true);
});

test("validador rejeita perda de origem e foto alterada", async () => {
  const m = buildFullManifest(source, false);
  m.produtos.pop();
  await assert.rejects(validateFullManifest(m));
  const other = buildFullManifest(source, false);
  other.produtos[0].variantes[0].imagem = "../../.env.import";
  await assert.rejects(validateFullManifest(other));
});

test("WebP mantém bytes/extensão e retry não duplica o lote nem categorias", async () => {
  const m = buildFullManifest(source, false);
  const temp = await mkdtemp(path.join(os.tmpdir(), "full-import-"));
  const rows = new Map();
  const photos = new Map();
  const api = {
    categories: async () =>
      new Map(m.produtos.map((p) => [p.categoria, p.categoria])),
    photo: async (name, bytes) => {
      assert.match(name, /\.webp$/);
      photos.set(name, bytes);
    },
    save: async (key, payload) => {
      if (!rows.has(key))
        rows.set(key, { ...payload, id: key, code: `P${rows.size + 1}` });
      return rows.get(key);
    },
  };
  const opts = {
    manifest: m,
    journalDir: temp,
    api,
    prepare: async (source) => ({
      bytes: await readFile(path.join("docs/produtos", source)),
    }),
  };
  try {
    await importPilot(opts);
    await importPilot(opts);
    assert.equal(rows.size, m.produtos.length);
    assert.equal(photos.size, 67);
    for (const bytes of photos.values())
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("categorias existentes são reutilizadas, faltantes criadas, arquivadas não reativadas", async () => {
  const { ensureCategories } = await import("./full-import.mjs");
  const m = buildFullManifest(source, false);
  const inserted = [];
  const names = [...new Set(m.produtos.map((p) => p.categoria))];
  const existing = [{ id: "existing", name: names[0], active: true }];
  const client = {
    from: () => ({
      select: () => ({
        in: async () => ({
          data: existing,
          error: null,
        }),
      }),
      insert: async (value) => {
        inserted.push(value.name);
        existing.push({ id: value.name, name: value.name, active: true });
        return { error: null };
      },
    }),
  };
  await ensureCategories(client, m);
  assert.deepEqual(inserted, names.slice(1));
  await ensureCategories(client, m);
  assert.deepEqual(inserted, names.slice(1));
  const archived = {
    from: () => ({
      select: () => ({
        in: async () => ({
          data: [{ id: "existing", name: names[0], active: false }],
          error: null,
        }),
      }),
    }),
  };
  await assert.rejects(ensureCategories(archived, m), /arquivada/);
});

test("Storage envia WebP com MIME correto e preserva compatibilidade JPEG", async () => {
  const { createApi } = await import("./catalog-import.mjs");
  const uploads = [];
  const client = {
    storage: {
      from: () => ({
        download: async () => ({ error: { statusCode: "404" } }),
        upload: async (name, bytes, options) => {
          uploads.push({ name, bytes, options });
          return { error: null };
        },
      }),
    },
  };
  const api = createApi(client, {});
  const bytes = Buffer.from("prepared");
  await api.photo("products/photo.webp", bytes);
  await api.photo("products/photo.jpg", bytes);
  assert.deepEqual(
    uploads.map((u) => u.options),
    [
      { contentType: "image/webp", upsert: false },
      { contentType: "image/jpeg", upsert: false },
    ],
  );
  assert.ok(uploads.every((u) => u.bytes === bytes));
});
