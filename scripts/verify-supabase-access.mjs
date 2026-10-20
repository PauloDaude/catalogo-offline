/** Direct HTTP checks. Provision disposable users only against local Supabase. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const local = process.argv.includes("--local");
let url = process.env.SUPABASE_TEST_URL;
let key = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
let adminPassword = process.env.SUPABASE_TEST_ADMIN_PASSWORD;
let ordinaryPassword = process.env.SUPABASE_TEST_USER_PASSWORD;
let adminEmail = process.env.SUPABASE_TEST_ADMIN_EMAIL;
let ordinaryEmail = process.env.SUPABASE_TEST_USER_EMAIL;
let service;
let created = [];
const fresh = (keyValue = key) =>
  createClient(url, keyValue, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
if (local) {
  const status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  url = status.API_URL;
  key = status.PUBLISHABLE_KEY || status.ANON_KEY;
  assert.equal(new URL(url).hostname, "127.0.0.1");
  service = fresh(status.SECRET_KEY || status.SERVICE_ROLE_KEY);
  const suffix = crypto.randomUUID();
  adminEmail = `admin-${suffix}@example.test`;
  ordinaryEmail = `user-${suffix}@example.test`;
  adminPassword = ordinaryPassword = `Test-${crypto.randomUUID()}!aA1`;
  for (const email of [adminEmail, ordinaryEmail]) {
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: adminPassword,
      email_confirm: true,
    });
    assert.equal(error, null);
    created.push(data.user.id);
  }
  execFileSync(
    "docker",
    [
      "exec",
      "supabase_db_catalogo",
      "psql",
      "-U",
      "postgres",
      "-c",
      `insert into public.catalog_admins values ('${created[0]}');`,
    ],
    { stdio: "pipe" },
  );
}
assert.ok(
  url &&
    key &&
    adminEmail &&
    adminPassword &&
    ordinaryEmail &&
    ordinaryPassword,
  "Configure as variáveis SUPABASE_TEST_* ou use --local.",
);
const anon = fresh(),
  user = fresh(),
  admin = fresh();
let category, product, path;
async function denied(promise, label) {
  const { error } = await promise;
  assert.ok(error, label);
}
try {
  const settings = await (
    await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
  ).json();
  assert.equal(settings.disable_signup, true, "cadastro público bloqueado");
  assert.equal(settings.external.email, true, "login por email ativo");
  assert.equal(
    (
      await user.auth.signInWithPassword({
        email: ordinaryEmail,
        password: ordinaryPassword,
      })
    ).error,
    null,
  );
  assert.equal(
    (
      await admin.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })
    ).error,
    null,
  );
  assert.equal((await user.rpc("is_catalog_admin")).data, false);
  assert.equal((await admin.rpc("is_catalog_admin")).data, true);
  await denied(
    anon.from("catalog_admins").select("*"),
    "visitante não lê autorização",
  );
  await denied(
    user.from("catalog_admins").insert({
      user_id: created[1] || "00000000-0000-0000-0000-000000000099",
    }),
    "sem autopromoção",
  );
  await denied(
    user.from("categories").insert({ name: "Indevido" }),
    "comum não cadastra",
  );
  await denied(anon.rpc("save_product", {}), "visitante não chama gestão");
  const suffix = crypto.randomUUID();
  const c = await admin
    .from("categories")
    .insert({ name: `Teste ${suffix}` })
    .select()
    .single();
  assert.equal(c.error, null);
  category = c.data;
  path = `products/${suffix}.jpg`;
  const jpeg = readFileSync(
    new URL("../public/demo/photos/panela.jpg", import.meta.url),
  );
  for (const client of [anon, user])
    await denied(
      client.storage
        .from("product-photos")
        .upload(path, jpeg, { contentType: "image/jpeg" }),
      "upload não autorizado",
    );
  await denied(
    admin.storage
      .from("product-photos")
      .upload("bad/file.jpg", jpeg, { contentType: "image/jpeg" }),
    "caminho recusado",
  );
  await denied(
    admin.storage
      .from("product-photos")
      .upload(path, "<svg/>", { contentType: "image/svg+xml" }),
    "MIME recusado",
  );
  await denied(
    admin.storage
      .from("product-photos")
      .upload(path, Buffer.alloc(5242881), { contentType: "image/jpeg" }),
    "tamanho recusado",
  );
  assert.equal(
    (
      await admin.storage
        .from("product-photos")
        .upload(path, jpeg, { contentType: "image/jpeg", upsert: false })
    ).error,
    null,
  );
  const publicUrl = anon.storage.from("product-photos").getPublicUrl(path)
    .data.publicUrl;
  assert.equal((await fetch(publicUrl)).status, 200);
  await denied(
    admin.storage
      .from("product-photos")
      .update(path, jpeg, { contentType: "image/jpeg" }),
    "sobrescrita bloqueada",
  );
  const args = {
    p_id: null,
    p_expected_version: null,
    p_name: "Produto de teste",
    p_category_id: category.id,
    p_price_cents: 6500,
    p_previous_price_cents: 10000,
    p_image_path: path,
    p_active: true,
  };
  const parallel = await Promise.all(
    Array.from({ length: 12 }, () =>
      admin.rpc("save_product", { ...args, p_active: false }),
    ),
  );
  for (const result of parallel) assert.equal(result.error, null);
  assert.equal(
    new Set(parallel.map((result) => result.data.code)).size,
    12,
    "códigos concorrentes únicos",
  );
  const save = await admin.rpc("save_product", args);
  assert.equal(save.error, null);
  product = save.data;
  const snapshot = await anon.rpc("read_catalog_snapshot");
  assert.equal(snapshot.error, null);
  assert.ok(snapshot.data.products.some((p) => p.id === product.id));
  const hide = await admin.rpc("save_product", {
    ...args,
    p_id: product.id,
    p_expected_version: product.version,
    p_active: false,
  });
  assert.equal(hide.error, null);
  product = hide.data;
  const hidden = await anon.from("products").select("*").eq("id", product.id);
  assert.deepEqual(hidden.data, []);
  assert.equal(
    (await user.from("products").select("*").eq("id", product.id)).data.length,
    0,
  );
  await denied(
    admin.rpc("save_product", {
      ...args,
      p_id: product.id,
      p_expected_version: 0,
    }),
    "conflito recusado",
  );
  assert.equal(
    (
      await admin.rpc("archive_category", {
        p_id: category.id,
        p_active: false,
      })
    ).error,
    null,
  );
  await denied(
    admin.rpc("save_product", {
      ...args,
      p_id: product.id,
      p_expected_version: product.version,
    }),
    "categoria arquivada recusada",
  );
  await user.storage.from("product-photos").remove([path]);
  assert.equal(
    (await fetch(publicUrl, { cache: "no-store" })).status,
    200,
    "remoção comum preserva bytes",
  );
  assert.deepEqual(
    (
      await user
        .from("products")
        .update({ name: "Indevido" })
        .eq("id", product.id)
        .select()
    ).data,
    [],
    "RLS não altera oculto",
  );
  assert.equal(
    (await admin.from("products").select("name").eq("id", product.id).single())
      .data.name,
    args.p_name,
  );
  for (let attempt = 0; attempt < 4; attempt++) {
    assert.equal(
      (
        await admin.rpc("archive_category", {
          p_id: category.id,
          p_active: true,
        })
      ).error,
      null,
    );
    const results = await Promise.all([
      admin.rpc("save_product", {
        ...args,
        p_id: product.id,
        p_expected_version: product.version,
        p_active: true,
      }),
      admin.rpc("archive_category", { p_id: category.id, p_active: false }),
    ]);
    assert.ok(
      results.some((result) => result.error),
      "corrida não pode arquivar categoria com ativo",
    );
    const current = await admin
      .from("products")
      .select("*")
      .eq("id", product.id)
      .single();
    product = current.data;
    if (product.active) {
      const hidden = await admin.rpc("save_product", {
        ...args,
        p_id: product.id,
        p_expected_version: product.version,
        p_active: false,
      });
      assert.equal(hidden.error, null);
      product = hidden.data;
    }
  }
  console.log(
    "PASS: API direta: visitante, usuário comum e administrador; RLS, snapshot, conflitos e Storage.",
  );
} finally {
  if (local && service) {
    // SQL cleanup is deliberately local; remote checks leave reversible test records.
    if (product)
      execFileSync(
        "docker",
        [
          "exec",
          "supabase_db_catalogo",
          "psql",
          "-U",
          "postgres",
          "-c",
          `delete from public.products where category_id='${category.id}';`,
        ],
        { stdio: "pipe" },
      );
    if (category)
      execFileSync(
        "docker",
        [
          "exec",
          "supabase_db_catalogo",
          "psql",
          "-U",
          "postgres",
          "-c",
          `delete from public.categories where id='${category.id}';`,
        ],
        { stdio: "pipe" },
      );
    if (path) await admin.storage.from("product-photos").remove([path]);
    for (const id of created) await service.auth.admin.deleteUser(id);
  }
  await Promise.all([user.auth.signOut(), admin.auth.signOut()]);
}
