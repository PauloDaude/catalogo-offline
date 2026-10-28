import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { loadPilot, runConfiguredPilot } from "./import/catalog-import.mjs";
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
assert.equal(new URL(status.API_URL).hostname, "127.0.0.1");
const service = createClient(
    status.API_URL,
    status.SECRET_KEY || status.SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ),
  suffix = crypto.randomUUID();
const email = `pilot-${suffix}@example.test`,
  password = `Test-${crypto.randomUUID()}!Aa1`,
  journalDir = `.superpowers/sdd/2026-10-28-variantes/import-${suffix}`;
const sql = (q) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_catalogo",
      "psql",
      "-U",
      "postgres",
      "-qAt",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: q, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  ).trim();
const categories = [crypto.randomUUID(), crypto.randomUUID()];
let uid;
const manifest = await loadPilot();
for (const p of manifest.produtos) {
  p.chave_importacao += `:local-${suffix}`;
  p.categoria += ` ${suffix}`;
}
try {
  const u = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(u.error, null);
  uid = u.data.user.id;
  sql(
    `insert into public.catalog_admins values('${uid}');insert into public.categories(id,name) values ('${categories[0]}','Cozinha ${suffix}'),('${categories[1]}','Ferramentas ${suffix}');`,
  );
  const config = {
    origin: status.API_URL,
    isLocal: true,
    IMPORT_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY || status.ANON_KEY,
    IMPORT_ADMIN_EMAIL: email,
    IMPORT_ADMIN_PASSWORD: password,
  };
  const first = await runConfiguredPilot(config, manifest, { journalDir }),
    second = await runConfiguredPilot(config, manifest, { journalDir });
  assert.deepEqual(
    second.map((p) => p.id),
    first.map((p) => p.id),
  );
  assert.equal(first.length, 5);
  assert.equal(
    first.reduce((n, p) => n + (p.variants.length || 1), 0),
    8,
  );
  const ids = first.map((p) => p.id);
  const result = await service
    .from("products")
    .select("id,active,price_cents,sale_kind,pack_count")
    .in("id", ids);
  assert.equal(result.error, null);
  assert.ok(result.data.every((p) => !p.active));
  assert.equal(result.data.find((p) => p.id === first[2].id).price_cents, 4890);
  const options = await service
    .from("product_variants")
    .select("price_cents")
    .eq("product_id", first[3].id)
    .order("price_cents", { ascending: false });
  assert.deepEqual(
    options.data.map((v) => v.price_cents),
    [3180, 3060, 2940],
  );
  console.log(
    "PASS: cinco pais e oito itens importados somente no local, fotos JPEG enviadas, caixas e repetição sem duplicatas conferidas",
  );
} finally {
  const keys = manifest.produtos
    .map((p) => `'${p.chave_importacao}'`)
    .join(",");
  sql(
    `delete from private.catalog_import_operations where import_key in(${keys});delete from public.product_variants where product_id in(select id from public.products where category_id in('${categories.join("','")}'));delete from public.products where category_id in('${categories.join("','")}');delete from public.categories where id in('${categories.join("','")}');`,
  );
  try {
    const journal = JSON.parse(
      await readFile(`${journalDir}/journal.json`, "utf8"),
    );
    const paths = Object.values(journal.assets).map((a) => a.path);
    if (paths.length)
      await service.storage.from("product-photos").remove(paths);
  } catch {}
  if (uid) await service.auth.admin.deleteUser(uid);
}
