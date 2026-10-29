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
const uploaded = [];
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
  const { readFile } = await import("node:fs/promises");
  const bytes = await readFile("public/demo/photos/panela.webp");
  const admin = clients[0],
    ordinary = clients[1];
  const upload = async (c, path, type = "image/webp", data = bytes) =>
    c.storage
      .from("product-photos")
      .upload(path, data, { contentType: type, upsert: false });
  const webp = `products/${crypto.randomUUID()}.webp`;
  const result = await upload(admin, webp);
  assert.equal(result.error, null);
  uploaded.push(webp);
  const jpeg = `products/${crypto.randomUUID()}.jpg`;
  assert.equal(
    (
      await upload(
        admin,
        jpeg,
        "image/jpeg",
        await readFile("public/demo/photos/panela.jpg"),
      )
    ).error,
    null,
  );
  uploaded.push(jpeg);
  for (const c of [anon, ordinary])
    assert.ok((await upload(c, `products/${crypto.randomUUID()}.webp`)).error);
  for (const [path, mime] of [
    [`products/${crypto.randomUUID()}.png`, "image/png"],
    [`products/${crypto.randomUUID()}.svg`, "image/svg+xml"],
    [`products/${crypto.randomUUID()}.html`, "text/html"],
    ["products/manual.webp", "image/webp"],
  ])
    assert.ok((await upload(admin, path, mime)).error);
  const base = {
    name: "WebP " + suffix,
    category_id: category,
    image_path: webp,
    price_cents: 100,
    active: true,
  };
  let saved = await admin.rpc("save_product_v2", { p_payload: base });
  assert.equal(saved.error, null);
  const parent = await admin.rpc("save_product_v2", {
    p_payload: {
      ...base,
      name: "Opções WebP " + suffix,
      has_variants: true,
      price_cents: null,
      variant_attribute: "Cor",
      variants: [
        { label: "WebP", price_cents: 100, image_path: webp, active: true },
        { label: "Legado", price_cents: 200, image_path: jpeg, active: true },
      ],
    },
  });
  assert.equal(parent.error, null);
  const publicSnapshot = await anon.rpc("read_catalog_snapshot_v2");
  assert.equal(publicSnapshot.error, null);
  const p = publicSnapshot.data.products.find((p) => p.id === parent.data.id);
  assert.equal(p.imagePath, webp);
  assert.ok(p.variants.some((v) => v.imagePath === jpeg));
  assert.ok(
    (
      await admin.rpc("save_product_v2", {
        p_payload: { ...base, image_path: "products/invalid.webp" },
      })
    ).error,
  );
  const read = await admin.storage.from("product-photos").download(webp);
  assert.equal(read.error, null);
  assert.equal(read.data.type, "image/webp");
  assert.deepEqual(Buffer.from(await read.data.arrayBuffer()), bytes);
  await ordinary.storage.from("product-photos").remove([webp]);
  assert.equal(
    (await admin.storage.from("product-photos").download(webp)).error,
    null,
  );
  assert.equal(
    (await admin.storage.from("product-photos").remove([webp])).error,
    null,
  );
  console.log(
    "PASS: WebP/JPEG, variantes, três perfis e bloqueio de formatos/caminhos indevidos",
  );
} finally {
  try {
    sql(
      `do $$ begin if to_regclass('private.catalog_import_operations') is not null then delete from private.catalog_import_operations where import_key='test-${suffix}'; end if; if to_regclass('public.product_variants') is not null then delete from public.product_variants where product_id in(select id from public.products where category_id='${category}'); end if; end $$;delete from public.products where category_id='${category}';delete from public.categories where id='${category}';`,
    );
  } finally {
    if (uploaded.length)
      await service.storage.from("product-photos").remove(uploaded);
    for (const id of ids) await service.auth.admin.deleteUser(id);
  }
}
