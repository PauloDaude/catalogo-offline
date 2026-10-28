/** End-to-end rehearsal, hard limited to a local Supabase Docker stack. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createBackup } from "./catalog-backup.mjs";
import { verifyBackup, sha256 } from "./manifest.mjs";

process.umask(0o077);
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
assert.equal(
  new URL(status.API_URL).hostname,
  "127.0.0.1",
  "ensaio permitido somente no Supabase local",
);
assert.equal(new URL(status.DB_URL).hostname, "127.0.0.1");
const client = createClient(
  status.API_URL,
  status.SECRET_KEY || status.SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const suffix = crypto.randomUUID().replaceAll("-", ""),
  db = `backup_verify_${suffix}`,
  bucket = `backup-verify-${suffix}`;
const category = crypto.randomUUID(),
  archived = crypto.randomUUID(),
  users = [],
  uploaded = [],
  restored = [];
const query = (database, sql) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_catalogo",
      "psql",
      "-U",
      "supabase_admin",
      "-d",
      database,
      "-qAt",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: sql, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  ).trim();
let dbCreated = false,
  bucketCreated = false,
  stage = "preparação";
try {
  for (const role of ["admin", "ordinary"]) {
    const { data, error } = await client.auth.admin.createUser({
      email: `backup-${role}-${suffix}@example.test`,
      password: `Test-${crypto.randomUUID()}!Aa1`,
      email_confirm: true,
    });
    assert.equal(error, null);
    users.push(data.user.id);
  }
  const image = `products/${crypto.randomUUID()}.jpg`;
  const bytes = await readFile(
    path.join(root, "public/demo/photos/panela.jpg"),
  );
  assert.equal(
    (
      await client.storage
        .from("product-photos")
        .upload(image, bytes, { contentType: "image/jpeg" })
    ).error,
    null,
  );
  uploaded.push(image);
  const orphan = `products/${crypto.randomUUID()}.jpg`;
  assert.equal(
    (
      await client.storage
        .from("product-photos")
        .upload(orphan, bytes, { contentType: "image/jpeg" })
    ).error,
    null,
  );
  uploaded.push(orphan);
  query(
    "postgres",
    `insert into public.catalog_admins values ('${users[0]}');
    insert into public.categories(id,name,active) values ('${category}','Backup ${suffix}',true),('${archived}','Arquivada ${suffix}',false);
    insert into public.products(name,category_id,price_cents,image_path,active) values
     ('Visível ${suffix}','${category}',6500,'${image}',true),('Oculto ${suffix}','${archived}',4500,'${image}',false);`,
  );
  const config = {
    root,
    outputDir: path.join(root, "backups"),
    apiUrl: status.API_URL,
    databaseUrl: status.DB_URL,
    storageKey: status.SECRET_KEY || status.SERVICE_ROLE_KEY,
    tools: "docker",
    image: "public.ecr.aws/supabase/postgres:17.11.0.004",
  };
  stage = "exportar banco e fotos";
  const backup = await createBackup(config);
  const manifest = await verifyBackup(backup.path);
  const meta = JSON.parse(
    await readFile(path.join(backup.path, "metadata.json"), "utf8"),
  );
  assert.ok(
    meta.catalog.products.some(
      (p) => p.name === `Oculto ${suffix}` && !p.active,
    ),
  );
  assert.ok(meta.objects.some((o) => o.name === orphan));
  assert.ok(
    !(await readFile(path.join(backup.path, "roles.sql"), "utf8")).includes(
      "PASSWORD '",
    ),
  );
  query("postgres", `create database ${db} template template0;`);
  dbCreated = true;
  query(db, "drop schema public;");
  stage = "restaurar dump";
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_catalogo",
      "pg_restore",
      "-U",
      "supabase_admin",
      "--no-owner",
      "--exit-on-error",
      "-d",
      db,
    ],
    {
      input: await readFile(path.join(backup.path, "database.dump")),
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  stage = "conferir dados e Auth";
  assert.equal(
    Number(query(db, "select count(*) from public.products;")),
    meta.catalog.products.length,
  );
  assert.equal(
    Number(query(db, "select count(*) from public.categories;")),
    meta.catalog.categories.length,
  );
  assert.equal(
    Number(query(db, "select count(*) from auth.users;")),
    meta.authUsers,
  );
  assert.equal(
    query(
      db,
      `select exists(select 1 from auth.users where id='${users[0]}' and encrypted_password is not null);`,
    ),
    "t",
  );
  assert.equal(
    query(
      db,
      `select exists(select 1 from public.catalog_admins where user_id='${users[0]}');`,
    ),
    "t",
  );
  assert.equal(
    query(
      db,
      `select count(*)=2 from public.products where category_id in ('${category}','${archived}') and price_cents in (6500,4500);`,
    ),
    "t",
  );
  assert.equal(
    query(db, "select last_value from private.product_code_seq;"),
    String(meta.catalog.sequence),
  );
  stage = "conferir sequência";
  const next = query(
    db,
    `insert into public.products(name,category_id,price_cents,image_path) values ('Novo após recuperar','${category}',100,'${image}') returning code;`,
  ).split("\n")[0];
  assert.ok(Number(next.slice(1)) > Number(meta.catalog.sequence));
  stage = "busca do painel recuperado";
  const page = JSON.parse(
    query(
      db,
      `set role authenticated;set request.jwt.claim.sub='${users[0]}';select public.list_admin_products(1,'visivel ${suffix}',null,'all');`,
    ),
  );
  assert.equal(page.total, 1);
  assert.equal(page.products[0].name, `Visível ${suffix}`);
  stage = "conferir RLS";
  const visible = Number(
    query(db, "set role anon;select count(*) from public.products;"),
  );
  assert.ok(visible < meta.catalog.products.length + 1);
  assert.equal(
    query(db, "select has_table_privilege('anon','public.products','INSERT');"),
    "f",
  );
  assert.equal(
    query(
      db,
      `set role authenticated;set request.jwt.claim.sub='${users[1]}';select public.is_catalog_admin();`,
    ),
    "f",
  );
  assert.equal(
    query(
      db,
      `set role authenticated;set request.jwt.claim.sub='${users[0]}';select public.is_catalog_admin();`,
    ),
    "t",
  );
  for (const id of [users[1], users[0]]) {
    const value = JSON.parse(
      query(
        db,
        `set role authenticated;set request.jwt.claim.sub='${id}';select jsonb_build_object('count',(select count(*) from public.products),'write',has_table_privilege(current_user,'public.products','UPDATE'));`,
      ),
    );
    assert.equal(
      value.count,
      id === users[0] ? meta.catalog.products.length + 1 : visible,
    );
  }
  // An unauthorized attempted write must not modify any hidden row.
  assert.equal(
    query(
      db,
      `set role authenticated;set request.jwt.claim.sub='${users[1]}';with changed as (update public.products set price_cents=1 where category_id='${archived}' returning id) select count(*) from changed;`,
    ),
    "0",
  );
  assert.equal(
    query(
      db,
      `set role authenticated;set request.jwt.claim.sub='${users[0]}';with changed as (update public.products set price_cents=4600 where category_id='${archived}' returning id) select count(*) from changed;`,
    ),
    "1",
  );
  assert.equal(
    query(
      db,
      "select exists(select 1 from pg_policies where schemaname='storage' and tablename='objects');",
    ),
    "t",
  );
  stage = "restaurar fotos";
  assert.equal(
    (
      await client.storage.createBucket(bucket, {
        public: false,
        allowedMimeTypes: ["image/jpeg"],
      })
    ).error,
    null,
  );
  bucketCreated = true;
  for (const object of meta.objects) {
    const bytes = await readFile(path.join(backup.path, "photos", object.name));
    assert.equal(
      (
        await client.storage
          .from(bucket)
          .upload(object.name, bytes, { contentType: "image/jpeg" })
      ).error,
      null,
    );
    restored.push(object.name);
    const download = await client.storage.from(bucket).download(object.name);
    assert.equal(download.error, null);
    assert.equal(
      sha256(Buffer.from(await download.data.arrayBuffer())),
      sha256(bytes),
    );
  }
  console.log(
    `PASS: dump restaurado, Auth e autorização preservados, sequência e RLS de 3 perfis conferidas, ${manifest.summary.photos} fotos recuperadas com hashes iguais\nCópia fictícia local: ${backup.path}`,
  );
} catch {
  console.error(
    `Falha no ensaio local de restauração: ${stage}, nenhuma operação no projeto remoto`,
  );
  process.exitCode = 1;
} finally {
  if (restored.length)
    for (let i = 0; i < restored.length; i += 100)
      await client.storage.from(bucket).remove(restored.slice(i, i + 100));
  if (bucketCreated) await client.storage.deleteBucket(bucket);
  if (dbCreated) query("postgres", `drop database ${db} with (force);`);
  query(
    "postgres",
    `delete from public.products where category_id in ('${category}','${archived}');delete from public.categories where id in ('${category}','${archived}');`,
  );
  if (uploaded.length)
    await client.storage.from("product-photos").remove(uploaded);
  for (const id of users) await client.auth.admin.deleteUser(id);
}
