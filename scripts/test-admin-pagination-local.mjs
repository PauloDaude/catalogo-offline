import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
if (new URL(status.API_URL).hostname !== "127.0.0.1")
  throw new Error("Somente ambiente local");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(
  status.API_URL,
  status.SECRET_KEY || status.SERVICE_ROLE_KEY,
  options,
);
const key = status.PUBLISHABLE_KEY || status.ANON_KEY;
const anon = createClient(status.API_URL, key, options);
const sql = (text) =>
  execFileSync(
    "docker",
    [
      "exec",
      "supabase_db_catalogo",
      "psql",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      text,
    ],
    { stdio: "pipe" },
  );
const suffix = crypto.randomUUID(),
  ids = [],
  cats = [crypto.randomUUID(), crypto.randomUUID()];
try {
  const clients = [];
  for (const role of ["admin", "user"]) {
    const email = `${role}-${suffix}@example.test`,
      password = `Test-${crypto.randomUUID()}!Aa1`;
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    assert.equal(error, null);
    ids.push(data.user.id);
    const client = createClient(status.API_URL, key, options);
    assert.equal(
      (await client.auth.signInWithPassword({ email, password })).error,
      null,
    );
    clients.push(client);
  }
  sql(`insert into public.catalog_admins values ('${ids[0]}');
    insert into public.categories(id,name) values ('${cats[0]}','Pagina ${suffix}'),('${cats[1]}','Vinculos ${suffix}');
    insert into public.products(name,category_id,price_cents,image_path,active)
    select 'Açúcar, (%) ${suffix} ' || i,'${cats[0]}',100,'products/00000000-0000-0000-0000-000000000000.jpg',i%2=1 from generate_series(1,105) i;
    insert into public.products(name,category_id,price_cents,image_path,active)
    select 'Vinculo ${suffix} ' || i,'${cats[1]}',100,'products/00000000-0000-0000-0000-000000000000.jpg',false from generate_series(1,1025) i;`);
  const args = {
    p_page: 1,
    p_query: suffix,
    p_category: cats[0],
    p_visibility: "all",
  };
  for (const client of [anon, clients[1]]) {
    assert.ok(
      (await client.rpc("list_admin_products", args)).error,
      "não administrador deve ser negado",
    );
    assert.ok(
      (
        await client.rpc("list_admin_category_products", {
          p_category: cats[1],
          p_active_only: false,
        })
      ).error,
    );
  }
  const rpc = async (extra = {}) => {
    const { data, error } = await clients[0].rpc("list_admin_products", {
      ...args,
      ...extra,
    });
    assert.equal(error, null);
    return data;
  };
  const first = await rpc();
  assert.equal(first.total, 105);
  assert.equal(first.products.length, 20);
  assert.deepEqual(
    (await rpc()).products.map((p) => p.id),
    first.products.map((p) => p.id),
  );
  const seen = new Set();
  for (let page = 1; page <= 6; page++) {
    const data = await rpc({ p_page: page });
    assert.equal(data.products.length, page === 6 ? 5 : 20);
    for (const p of data.products) {
      assert.ok(!seen.has(p.id));
      seen.add(p.id);
    }
  }
  assert.equal(seen.size, 105);
  assert.equal((await rpc({ p_page: 7 })).total, 105);
  assert.equal((await rpc({ p_page: 7 })).products.length, 0);
  assert.equal((await rpc({ p_visibility: "active" })).total, 53);
  assert.equal((await rpc({ p_visibility: "hidden" })).total, 52);
  assert.equal((await rpc({ p_query: "AÇUCAR, (%)" })).total, 105);
  assert.equal(
    (await rpc({ p_query: first.products[0].code })).products[0].id,
    first.products[0].id,
  );
  assert.equal((await rpc({ p_query: "inexistente" })).total, 0);
  assert.ok(
    (await clients[0].rpc("list_admin_products", { ...args, p_page: 0 })).error,
  );
  const links = await clients[0].rpc("list_admin_category_products", {
    p_category: cats[1],
    p_active_only: false,
  });
  assert.equal(links.error, null);
  assert.equal(links.data.length, 1025);
  const active = await clients[0].rpc("list_admin_category_products", {
    p_category: cats[1],
    p_active_only: true,
  });
  assert.equal(active.error, null);
  assert.equal(active.data.length, 0);
  console.log(
    "PASS: 105 produtos, páginas 1–7, filtros, busca literal/acentos, 1025 vínculos e autorização de 3 perfis",
  );
} finally {
  sql(
    `delete from public.products where category_id in ('${cats.join("','")}');delete from public.categories where id in ('${cats.join("','")}');`,
  );
  for (const id of ids) await service.auth.admin.deleteUser(id);
}
