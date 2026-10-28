import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  chmod,
  symlink,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadConfig } from "./config.mjs";
import { toolCommand, runTool } from "./database.mjs";
import { createBackup } from "./catalog-backup.mjs";
import { verifyBackup } from "./manifest.mjs";

const temp = () => mkdtemp(path.join(os.tmpdir(), "catalog-backup-test-"));
const photo = "products/00000000-0000-0000-0000-000000000001.jpg";
const config = (root) => ({
  root,
  outputDir: path.join(root, "backups"),
  apiUrl: "http://127.0.0.1:54321",
  databaseUrl: "postgresql://postgres:fake-password@127.0.0.1:54322/postgres",
  storageKey: "fake-secret-key",
  tools: "docker",
  image: "postgres:17",
});
const metadata = () => ({
  catalog: {
    products: [
      {
        id: "p",
        code: "P001",
        name: "Oculto",
        active: false,
        image_path: photo,
      },
    ],
    categories: [{ id: "c", active: false }],
    admins: [{ user_id: "a" }],
    revision: 5,
    sequence: 10,
  },
  objects: [{ name: photo, metadata: { size: 3 } }],
  bucket: { id: "product-photos", public: true },
  authUsers: 1,
});
const deps = (meta = metadata()) => ({
  database: {
    readMetadata: async () => structuredClone(meta),
    version: async () => "17",
    dump: async (dest) => {
      await writeFile(path.join(dest, "database.dump"), "dump");
      await writeFile(path.join(dest, "roles.sql"), "roles");
    },
  },
  storage: { download: async () => new Blob(["jpg"]) },
  migrationsDir: null,
});

test("configuração ausente não vaza segredos", async () => {
  const root = await temp();
  await assert.rejects(loadConfig({ root, env: {} }), /BACKUP_DATABASE_URL/);
  await assert.rejects(
    loadConfig({ root, env: { BACKUP_DATABASE_URL: "not-valid-secret" } }),
    (e) => !e.message.includes("not-valid-secret"),
  );
});

test("configuração rejeita arquivo exposto e projeto diferente", async () => {
  const root = await temp(),
    file = path.join(root, ".env.backup");
  await writeFile(file, "BACKUP_DATABASE_URL=x", { mode: 0o644 });
  await assert.rejects(loadConfig({ root, env: {} }), /chmod 600/);
  await chmod(file, 0o600);
  await assert.rejects(
    loadConfig({
      root,
      env: {
        BACKUP_DATABASE_URL:
          "postgresql://postgres:secret@db.other.supabase.co:5432/postgres",
        BACKUP_SUPABASE_URL: "https://myproject.supabase.co",
        BACKUP_STORAGE_KEY: "secret",
      },
    }),
    /mesmo projeto/,
  );
});

test("senhas não aparecem nos argumentos das ferramentas", () => {
  const cmd = toolCommand(config("/tmp"), "pg_dump", ["--format=custom"]);
  assert.ok(!JSON.stringify(cmd.args).includes("fake-password"));
  assert.equal(cmd.env.PGPASSWORD, "fake-password");
  assert.ok(cmd.args.includes("PGPASSWORD"));
});

test("backup completo preserva ocultos, fotos e hashes, detecta corrupção", async () => {
  const root = await temp(),
    result = await createBackup(config(root), deps());
  const manifest = await verifyBackup(result.path);
  assert.equal(manifest.summary.products, 1);
  assert.equal(manifest.summary.photos, 1);
  assert.equal(
    (await readFile(path.join(result.path, "photos", photo))).toString(),
    "jpg",
  );
  await writeFile(path.join(result.path, "photos", photo), "bad");
  await assert.rejects(verifyBackup(result.path), /integridade/);
  await rm(root, { recursive: true, force: true });
});

test("mais de mil fotos são exportadas sem truncamento", async () => {
  const root = await temp(),
    meta = metadata();
  meta.objects = Array.from({ length: 1005 }, (_, i) => ({
    name: `products/00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}.jpg`,
    metadata: { size: 3 },
  }));
  const result = await createBackup(config(root), deps(meta));
  assert.equal((await verifyBackup(result.path)).summary.photos, 1005);
  await rm(root, { recursive: true, force: true });
});

test("foto vinculada ausente, caminho inseguro e tamanho errado impedem conclusão", async () => {
  for (const change of [
    (m) => (m.objects = []),
    (m) => (m.objects[0].name = "../outside"),
    (m) => (m.objects[0].metadata.size = 20),
  ]) {
    const root = await temp(),
      meta = metadata();
    change(meta);
    await assert.rejects(createBackup(config(root), deps(meta)));
    await rm(root, { recursive: true, force: true });
  }
});

test("falha de download/dump não anuncia sucesso nem vaza resposta administrativa", async () => {
  for (const failing of ["download", "dump"]) {
    const root = await temp(),
      d = deps();
    if (failing === "download")
      d.storage.download = async () => {
        throw new Error("fake-secret-key Authorization: senha");
      };
    else
      d.database.dump = async () => {
        throw new Error("fake-password URL admin");
      };
    await assert.rejects(
      createBackup(config(root), d),
      (e) =>
        !e.message.includes("fake-secret") &&
        !e.message.includes("fake-password"),
    );
    const dirs = await (
      await import("node:fs/promises")
    ).readdir(path.join(root, "backups"));
    assert.ok(dirs.every((name) => name.endsWith(".incomplete")));
    await rm(root, { recursive: true, force: true });
  }
});

test("mudança concorrente invalida cópia e preserva backups anteriores", async () => {
  const root = await temp(),
    cfg = config(root),
    first = await createBackup(cfg, deps()),
    d = deps();
  let calls = 0;
  d.database.readMetadata = async () => {
    const m = metadata();
    if (calls++ > 0) m.catalog.revision++;
    return m;
  };
  await assert.rejects(createBackup(cfg, d), /alterado/);
  await verifyBackup(first.path);
  await rm(root, { recursive: true, force: true });
});

test("verificador rejeita pasta incompleta, arquivo ausente e symlinks", async () => {
  const root = await temp(),
    result = await createBackup(config(root), deps());
  await assert.rejects(verifyBackup(`${result.path}.incomplete`));
  await rm(path.join(result.path, "roles.sql"));
  await assert.rejects(verifyBackup(result.path));
  await symlink("/etc/passwd", path.join(result.path, "roles.sql"));
  await assert.rejects(verifyBackup(result.path));
  await rm(root, { recursive: true, force: true });
});

test("destino symlink não recebe dados administrativos", async () => {
  const root = await temp(),
    outside = await temp();
  await symlink(outside, path.join(root, "backups"));
  await assert.rejects(createBackup(config(root), deps()));
  await rm(root, { recursive: true, force: true });
  await rm(outside, { recursive: true, force: true });
});

test("ferramenta ausente falha com erro simples sem senha", async () => {
  await assert.rejects(
    runTool(
      { ...config("/tmp"), tools: "native" },
      "catalog-backup-nonexistent-executable",
      [],
    ),
    (e) =>
      !e.message.includes("fake-password") &&
      /ferramentas locais/.test(e.message),
  );
});

test("configuração local válida não lê credenciais VITE_", async () => {
  const root = await temp();
  const value = await loadConfig({
    root,
    env: {
      BACKUP_DATABASE_URL:
        "postgresql://postgres:fake-password@127.0.0.1:54322/postgres",
      BACKUP_SUPABASE_URL: "http://127.0.0.1:54321",
      BACKUP_STORAGE_KEY: "fake-key",
    },
  });
  assert.equal(value.outputDir, path.join(root, "backups"));
  assert.equal(value.tools, "docker");
  await rm(root, { recursive: true, force: true });
});

test("dump inclui extensões necessárias e rejeita nomes inválidos", async () => {
  const { dumpArguments } = await import("./database.mjs");
  const args = dumpArguments([
    { name: "unaccent", schema: "extensions", version: "1.1" },
  ]);
  assert.ok(args.includes("--extension=unaccent"));
  assert.ok(args.includes("--schema=auth"));
  assert.throws(() => dumpArguments([{ name: "*", schema: "extensions" }]));
});

test("backup V2 verifica foto exclusiva de variante e aceita pacotes V1", async () => {
  const root = await temp(),
    meta = metadata();
  meta.catalog.variantSchema = true;
  meta.catalog.variants = [
    {
      id: "variant",
      product_id: "p",
      image_path: photo,
      label: "Grande",
      price_cents: 3180,
    },
  ];
  const result = await createBackup(config(root), deps(meta));
  const manifest = await verifyBackup(result.path);
  assert.equal(manifest.version, 2);
  assert.equal(manifest.summary.variants, 1);
  const changed = deps(meta);
  let calls = 0;
  changed.database.readMetadata = async () => {
    const m = structuredClone(meta);
    if (calls++ > 0) m.catalog.variants[0].label = "Pequeno";
    return m;
  };
  await assert.rejects(createBackup(config(root), changed), /alterado/);
  await rm(root, { recursive: true, force: true });
});
