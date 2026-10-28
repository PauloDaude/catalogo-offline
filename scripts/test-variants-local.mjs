import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
assert.equal(new URL(status.API_URL).hostname, "127.0.0.1");
const opts = { auth: { persistSession: false, autoRefreshToken: false } },
  key = status.PUBLISHABLE_KEY || status.ANON_KEY;
const service = createClient(
    status.API_URL,
    status.SECRET_KEY || status.SERVICE_ROLE_KEY,
    opts,
  ),
  anon = createClient(status.API_URL, key, opts);
const suffix = crypto.randomUUID(),
  ids = [],
  clients = [],
  category = crypto.randomUUID();
const sql = (text) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_catalogo",
      "psql",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-qAt",
    ],
    { input: text, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
const image = "products/00000000-0000-0000-0000-000000000000.jpg";
try {
  for (const role of ["admin", "ordinary"]) {
    const email = `variants-${role}-${suffix}@example.test`,
      password = `Test-${crypto.randomUUID()}!Aa1`;
    const u = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    assert.equal(u.error, null);
    ids.push(u.data.user.id);
    const c = createClient(status.API_URL, key, opts);
    assert.equal(
      (await c.auth.signInWithPassword({ email, password })).error,
      null,
    );
    clients.push(c);
  }
  sql(
    `insert into public.catalog_admins values ('${ids[0]}');insert into public.categories(id,name) values ('${category}','Variantes ${suffix}');`,
  );
  const base = {
    name: `Processador ${suffix}`,
    category_id: category,
    image_path: image,
    active: true,
    has_variants: true,
    variant_attribute: "Capacidade",
    variants: [
      { label: "500 ml", price_cents: 1490, active: true },
      { label: "900 ml", price_cents: 2190, active: true },
    ],
  };
  const save = async (payload) => {
    const r = await clients[0].rpc("save_product_v2", { p_payload: payload });
    assert.equal(r.error, null);
    return r.data;
  };
  const parent = await save(base);
  assert.equal(parent.variants.length, 2);
  assert.equal(parent.price_cents, null);
  assert.match(parent.variants[0].code, /^P\d+-V\d+$/);
  assert.equal(
    (await anon.rpc("read_catalog_snapshot_v2")).data.schemaVersion,
    2,
  );
  for (const c of [anon, clients[1]])
    assert.ok((await c.rpc("save_product_v2", { p_payload: base })).error);
  for (const change of [
    (p) => (p.variants[0].previous_price_cents = 100),
    (p) => (p.variants[0].pack_count = 0),
    (p) => (p.variants[1].label = "500 ML"),
    (p) => (p.variants = []),
  ]) {
    const p = structuredClone(base);
    change(p);
    assert.ok(
      (await clients[0].rpc("save_product_v2", { p_payload: p })).error,
    );
  }
  const simple = await save({
    name: `Caixa ${suffix}`,
    category_id: category,
    image_path: image,
    active: true,
    price_cents: 3180,
    sale_kind: "box",
    pack_count: 12,
    units_per_pack: 1,
  });
  assert.equal(simple.sale_kind, "box");
  assert.equal(simple.price_cents, 3180);
  const foreign = structuredClone(base);
  foreign.variants[0].id = parent.variants[0].id;
  foreign.variants[0].version = parent.variants[0].version;
  assert.ok(
    (await clients[0].rpc("save_product_v2", { p_payload: foreign })).error,
  );
  const stale = { ...parent, expected_version: parent.version - 1 };
  assert.ok(
    (await clients[0].rpc("save_product_v2", { p_payload: stale })).error,
  );
  const page = await clients[0].rpc("list_admin_products_v2", {
    p_page: 1,
    p_query: "900 ml",
    p_category: category,
    p_visibility: "all",
  });
  assert.equal(page.error, null);
  assert.equal(page.data.total, 1);
  const old = await anon.rpc("read_catalog_snapshot");
  assert.ok(
    !old.data.products.some((p) => [parent.id, simple.id].includes(p.id)),
  );
  const forged = await clients[0].from("product_variants").insert({
    id: parent.id,
    product_id: parent.id,
    code: "manual",
    label: "Forjada",
    price_cents: 1,
  });
  const backwards = await clients[0]
    .from("products")
    .update({ next_variant_number: 1 })
    .eq("id", parent.id);
  assert.deepEqual(
    [!!forged.error, !!backwards.error],
    [true, true],
    "identidade cruzada e contador regressivo são proibidos",
  );
  const hidden = await save({
    ...parent,
    expected_version: parent.version,
    active: false,
  });
  assert.equal(hidden.active, false);
  assert.ok(
    !(
      await anon
        .from("product_variants")
        .select("*")
        .eq("product_id", parent.id)
    ).data.length,
  );
  const importKey = `test-${suffix}`,
    payload = { ...base, active: false };
  const first = await clients[0].rpc("import_product_v2", {
    p_import_key: importKey,
    p_payload: payload,
  });
  assert.equal(first.error, null);
  const second = await clients[0].rpc("import_product_v2", {
    p_import_key: importKey,
    p_payload: payload,
  });
  assert.equal(second.data.id, first.data.id);
  assert.ok(
    (
      await clients[0].rpc("import_product_v2", {
        p_import_key: importKey,
        p_payload: { ...payload, name: "alterado" },
      })
    ).error,
  );
  console.log(
    "PASS: variantes, caixas, conflitos, preços, RLS, compatibilidade e importação idempotente",
  );
} finally {
  try {
    sql(
      `do $$ begin if to_regclass('private.catalog_import_operations') is not null then delete from private.catalog_import_operations where import_key='test-${suffix}'; end if; if to_regclass('public.product_variants') is not null then delete from public.product_variants where product_id in(select id from public.products where category_id='${category}'); end if; end $$;delete from public.products where category_id='${category}';delete from public.categories where id='${category}';`,
    );
  } finally {
    for (const id of ids) await service.auth.admin.deleteUser(id);
  }
}
