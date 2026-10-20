/** Rehearse database + photo restore in disposable local destinations. */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
process.umask(0o077);
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
assert.equal(new URL(status.API_URL).hostname, "127.0.0.1");
const client = createClient(
  status.API_URL,
  status.SECRET_KEY || status.SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const suffix = crypto.randomUUID().replaceAll("-", "");
const db = `restore_verify_${suffix}`,
  bucket = `restore-verify-${suffix}`;
const folder = `.superpowers/sdd/2026-10-20-painel-administrativo/backup-${suffix}`;
mkdirSync(folder, { recursive: true, mode: 0o700 });
const docker = (args, input) =>
  execFileSync("docker", args, { input, stdio: ["pipe", "pipe", "pipe"] });
const query = (database, sql) =>
  docker([
    "exec",
    "supabase_db_catalogo",
    "psql",
    "-U",
    "supabase_admin",
    "-d",
    database,
    "-At",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    sql,
  ])
    .toString()
    .trim();
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const countSql =
  "select (select count(*) from public.products), (select count(*) from public.categories), (select count(*) from public.catalog_admins), (select revision from public.catalog_state);";
let dbCreated = false,
  bucketCreated = false;
const paths = [];
try {
  const before = query("postgres", countSql);
  const dump = docker([
    "exec",
    "supabase_db_catalogo",
    "pg_dump",
    "-U",
    "supabase_admin",
    "-Fc",
    "--no-owner",
    "--no-acl",
    "postgres",
  ]);
  writeFileSync(`${folder}/database.dump`, dump, { mode: 0o600 });
  docker([
    "exec",
    "supabase_db_catalogo",
    "createdb",
    "-U",
    "supabase_admin",
    "-T",
    "template0",
    db,
  ]);
  dbCreated = true;
  docker(
    [
      "exec",
      "-i",
      "supabase_db_catalogo",
      "pg_restore",
      "-U",
      "supabase_admin",
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-privileges",
      "--exit-on-error",
      "-d",
      db,
    ],
    readFileSync(`${folder}/database.dump`),
  );
  assert.equal(query(db, countSql), before, "contagens e revisão restauradas");
  assert.equal(
    query(db, "select count(*)=count(distinct code) from public.products;"),
    "t",
  );
  const created = await client.storage.createBucket(bucket, {
    public: false,
    allowedMimeTypes: ["image/jpeg"],
    fileSizeLimit: 5242880,
  });
  assert.equal(created.error, null);
  bucketCreated = true;
  const listed = await client.storage
    .from("product-photos")
    .list("products", { limit: 1000 });
  assert.equal(listed.error, null);
  for (const object of listed.data) {
    assert.match(object.name, /^[0-9a-f-]{36}\.jpg$/);
    const path = `products/${object.name}`;
    const download = await client.storage.from("product-photos").download(path);
    assert.equal(download.error, null);
    const bytes = Buffer.from(await download.data.arrayBuffer());
    writeFileSync(`${folder}/${object.name}`, bytes, { mode: 0o600 });
    const restored = readFileSync(`${folder}/${object.name}`);
    const upload = await client.storage
      .from(bucket)
      .upload(path, restored, { contentType: "image/jpeg" });
    assert.equal(upload.error, null);
    paths.push(path);
    const verify = await client.storage.from(bucket).download(path);
    assert.equal(verify.error, null);
    assert.equal(
      hash(Buffer.from(await verify.data.arrayBuffer())),
      hash(bytes),
    );
  }
  assert.ok(paths.length > 0, "precisa haver foto para verificar restauração");
  console.log(
    `PASS: dump restaurado em banco descartável; ${paths.length} fotos exportadas e restauradas em bucket privado, hashes iguais. Backup local ignorado pelo Git.`,
  );
} finally {
  if (paths.length) await client.storage.from(bucket).remove(paths);
  if (bucketCreated) await client.storage.deleteBucket(bucket);
  if (dbCreated)
    docker([
      "exec",
      "supabase_db_catalogo",
      "dropdb",
      "-U",
      "supabase_admin",
      db,
    ]);
}
