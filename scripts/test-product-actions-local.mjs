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
  const admin = clients[0];
  const save = async (payload) => {
    const r = await admin.rpc("save_product_v2", { p_payload: payload });
    assert.equal(r.error, null);
    return r.data;
  };
  const simple = async (name, active = true) =>
    save({
      name,
      category_id: category,
      image_path: image,
      active,
      price_cents: 100,
    });
  const get = async (id) => {
    const r = await admin
      .from("products")
      .select("*,variants:product_variants(*)")
      .eq("id", id)
      .single();
    assert.equal(r.error, null);
    return r.data;
  };
  const item = (p) => ({ id: p.id, expected_version: p.version });
  const a = await simple("A " + suffix),
    b = await simple("B " + suffix, false);
  const args = { p_items: [item(a), item(b)], p_active: false };
  let r = await admin.rpc("set_products_visibility", args);
  assert.equal(r.error, null);
  assert.equal(r.data.updated, 1);
  assert.equal((await get(a.id)).active, false);
  assert.equal((await get(b.id)).version, b.version);
  for (const c of [anon, clients[1]]) {
    assert.ok(
      (await c.rpc("set_products_visibility", { ...args, p_active: true }))
        .error,
    );
    assert.ok(
      (
        await c.rpc("remove_product", {
          p_id: b.id,
          p_expected_version: b.version,
        })
      ).error,
    );
  }
  const aa = await get(a.id);
  r = await admin.rpc("set_products_visibility", {
    p_items: [item(aa), { ...item(b), expected_version: 0 }],
    p_active: true,
  });
  assert.equal(r.error?.code, "40001");
  assert.equal((await get(a.id)).active, false);
  for (const items of [
    [],
    [item(aa), item(aa)],
    [{ id: crypto.randomUUID(), expected_version: 1 }],
    Array(1001).fill(item(aa)),
  ]) {
    assert.ok(
      (
        await admin.rpc("set_products_visibility", {
          p_items: items,
          p_active: true,
        })
      ).error,
    );
  }
  sql(`update public.categories set active=false where id='${category}';`);
  assert.equal(
    (
      await admin.rpc("set_products_visibility", {
        p_items: [item(aa), item(b)],
        p_active: true,
      })
    ).error?.code,
    "23514",
  );
  sql(`update public.categories set active=true where id='${category}';`);
  const v = await save({
    name: "Variante " + suffix,
    category_id: category,
    image_path: image,
    active: false,
    has_variants: true,
    variant_attribute: "Tamanho",
    variants: [
      {
        label: "G",
        price_cents: 3180,
        active: false,
        sale_kind: "box",
        pack_count: 12,
        units_per_pack: 1,
      },
    ],
  });
  assert.equal(
    (
      await admin.rpc("set_products_visibility", {
        p_items: [item(aa), item(v)],
        p_active: true,
      })
    ).error?.code,
    "23514",
  );
  assert.equal((await get(a.id)).active, false);
  const visible = await simple("Visível " + suffix);
  assert.equal(
    (
      await admin.rpc("remove_product", {
        p_id: visible.id,
        p_expected_version: visible.version,
      })
    ).error?.code,
    "23514",
  );
  assert.ok((await admin.from("products").delete().eq("id", visible.id)).error);
  assert.ok(
    (await admin.from("product_variants").delete().eq("product_id", v.id))
      .error,
  );
  assert.equal(
    (await admin.rpc("remove_product", { p_id: a.id, p_expected_version: 0 }))
      .error?.code,
    "40001",
  );
  assert.equal(
    (
      await admin.rpc("remove_product", {
        p_id: aa.id,
        p_expected_version: aa.version,
      })
    ).error,
    null,
  );
  assert.equal(
    (await admin.from("products").select("id").eq("id", aa.id)).data.length,
    0,
  );
  const payload = {
    name: "Importado " + suffix,
    category_id: category,
    image_path: image,
    active: false,
    has_variants: true,
    variant_attribute: "Modelo",
    variants: [{ label: "Único", price_cents: 100, active: true }],
  };
  const importKey = "actions-" + suffix;
  const imported = await admin.rpc("import_product_v2", {
    p_import_key: importKey,
    p_payload: payload,
  });
  assert.equal(imported.error, null);
  const ip = imported.data;
  assert.equal(
    (
      await admin.rpc("remove_product", {
        p_id: ip.id,
        p_expected_version: ip.version,
      })
    ).error,
    null,
  );
  assert.equal(
    (await admin.from("product_variants").select("id").eq("product_id", ip.id))
      .data.length,
    0,
  );
  assert.equal(
    (
      await admin.rpc("import_product_v2", {
        p_import_key: importKey,
        p_payload: payload,
      })
    ).error?.code,
    "P0002",
  );
  assert.equal(
    sql(
      `select product_id is null and deleted_at is not null and deleted_code='${ip.code}' from private.catalog_import_operations where import_key='${importKey}';`,
    ).trim(),
    "t",
  );
  const next = await simple("Depois " + suffix);
  assert.ok(Number(next.code.slice(1)) > Number(ip.code.slice(1)));
  assert.equal(
    (
      await admin.rpc("set_products_visibility", {
        p_items: [item(b), item(v)],
        p_active: false,
      })
    ).error,
    null,
  );
  assert.equal(
    (
      await admin.rpc("remove_product", {
        p_id: v.id,
        p_expected_version: (await get(v.id)).version,
      })
    ).error,
    null,
  );
  const d1 = await simple("Lote oculto1 " + suffix, false),
    d2 = await simple("Lote oculto2 " + suffix, false);
  const removeBatch = (items) =>
    admin.rpc("remove_products", { p_items: items });
  assert.equal(
    (await removeBatch([item(d1), { ...item(d2), expected_version: 0 }])).error
      ?.code,
    "40001",
  );
  assert.equal((await get(d1.id)).active, false);
  assert.equal(
    (await removeBatch([item(d1), item(visible)])).error?.code,
    "23514",
  );
  assert.ok(await get(d1.id));
  for (const c of [anon, clients[1]])
    assert.ok((await c.rpc("remove_products", { p_items: [item(d1)] })).error);
  for (const items of [
    [],
    [item(d1), item(d1)],
    [{ id: crypto.randomUUID(), expected_version: 1 }],
  ])
    assert.ok((await removeBatch(items)).error);
  const batchKey = "actions-" + suffix + "-batch";
  const importedBatch = await admin.rpc("import_product_v2", {
    p_import_key: batchKey,
    p_payload: payload,
  });
  assert.equal(importedBatch.error, null);
  const batch = await removeBatch([
    item(d1),
    item(d2),
    item(importedBatch.data),
  ]);
  assert.equal(batch.error, null);
  assert.equal(batch.data.deleted, 3);
  assert.equal(
    (
      await admin
        .from("products")
        .select("id")
        .in("id", [d1.id, d2.id, importedBatch.data.id])
    ).data.length,
    0,
  );
  assert.equal(
    (
      await admin.rpc("import_product_v2", {
        p_import_key: batchKey,
        p_payload: payload,
      })
    ).error?.code,
    "P0002",
  );
  console.log(
    "PASS: lote integral, conflitos, três perfis, ocultos, variantes, tombstone e códigos preservados",
  );
} finally {
  try {
    sql(
      `do $$ begin if to_regclass('private.catalog_import_operations') is not null then delete from private.catalog_import_operations where import_key like 'actions-${suffix}%' or (product_id in(select id from public.products where category_id='${category}')); end if; if to_regclass('public.product_variants') is not null then delete from public.product_variants where product_id in(select id from public.products where category_id='${category}'); end if; end $$;delete from public.products where category_id='${category}';delete from public.categories where id='${category}';`,
    );
  } finally {
    for (const id of ids) await service.auth.admin.deleteUser(id);
  }
}
