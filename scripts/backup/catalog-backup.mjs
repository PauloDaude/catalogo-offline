import {
  mkdir,
  lstat,
  writeFile,
  readdir,
  readFile,
  rename,
  chmod,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadConfig, BackupError } from "./config.mjs";
import { createDatabase } from "./database.mjs";
import { createStorage } from "./storage.mjs";
import { inventory, photoPath, verifyBackup } from "./manifest.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const privateWrite = (file, bytes) =>
  writeFile(file, bytes, { mode: 0o600, flag: "wx" });

export async function createBackup(config, dependencies = {}) {
  if (path.resolve(config.outputDir) !== path.resolve(config.root, "backups"))
    throw new BackupError("O destino deve ser a pasta backups do projeto");
  await mkdir(config.outputDir, { recursive: true, mode: 0o700 });
  const rootStat = await lstat(config.outputDir);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink())
    throw new BackupError("O destino de backup não pode ser um link simbólico");
  await chmod(config.outputDir, 0o700);
  const name = `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0, 8)}`;
  const pending = path.join(config.outputDir, `${name}.incomplete`),
    final = path.join(config.outputDir, name);
  await mkdir(pending, { mode: 0o700 });
  const database = dependencies.database || createDatabase(config),
    storage = dependencies.storage || createStorage(config);
  try {
    const versions = await database.version();
    const before = await database.readMetadata();
    if (
      !before.bucket ||
      before.bucket.id !== "product-photos" ||
      !Array.isArray(before.objects) ||
      !Array.isArray(before.catalog?.products)
    )
      throw new BackupError(
        "O banco não contém o catálogo e o bucket esperados",
      );
    const names = new Set(before.objects.map((o) => photoPath(o.name)));
    if (names.size !== before.objects.length)
      throw new BackupError("Inventário de fotos duplicado");
    for (const p of before.catalog.products)
      if (!names.has(photoPath(p.image_path)))
        throw new BackupError(
          "Há produto com foto ausente no Storage, corrija antes de repetir o backup",
        );
    if (storage.check) await storage.check();
    await database.dump(pending, before.extensions);
    await mkdir(path.join(pending, "photos", "products"), {
      recursive: true,
      mode: 0o700,
    });
    for (const object of before.objects) {
      const blob = await storage.download(object.name);
      const bytes = Buffer.from(await blob.arrayBuffer());
      const expected = Number(object.metadata?.size);
      if (
        !Number.isSafeInteger(expected) ||
        expected < 1 ||
        bytes.length !== expected
      )
        throw new BackupError(
          "Tamanho de foto diferente do inventário, repita o backup sem editar produtos",
        );
      await privateWrite(path.join(pending, "photos", object.name), bytes);
    }
    const migrationsDir =
      dependencies.migrationsDir === undefined
        ? path.join(config.root, "supabase", "migrations")
        : dependencies.migrationsDir;
    if (migrationsDir) {
      await mkdir(path.join(pending, "migrations"), { mode: 0o700 });
      for (const file of await readdir(migrationsDir)) {
        if (!/^\d+_[a-z0-9_]+\.sql$/.test(file)) continue;
        const full = path.join(migrationsDir, file),
          stat = await lstat(full);
        if (!stat.isFile() || stat.isSymbolicLink())
          throw new BackupError("Migration local inválida");
        await privateWrite(
          path.join(pending, "migrations", file),
          await readFile(full),
        );
      }
    }
    const after = await database.readMetadata();
    if (JSON.stringify(before) !== JSON.stringify(after))
      throw new BackupError(
        "O catálogo ou as fotos foram alterados durante a cópia, repita sem edições simultâneas",
      );
    await privateWrite(
      path.join(pending, "metadata.json"),
      JSON.stringify(before, null, 2),
    );
    let commit = "unknown";
    try {
      commit = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: config.root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {}
    const manifest = {
      format: "cirandinha-backup",
      version: 1,
      complete: true,
      createdAt: new Date().toISOString(),
      origin: config.apiUrl,
      commit,
      postgres: versions,
      summary: {
        products: before.catalog.products.length,
        categories: before.catalog.categories.length,
        photos: before.objects.length,
        authUsers: before.authUsers,
      },
      files: await inventory(pending),
    };
    await privateWrite(
      path.join(pending, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    // Dump tools may create files themselves, enforce private modes before finalizing.
    for (const file of manifest.files)
      await chmod(path.join(pending, file.path), 0o600);
    await verifyBackup(pending, { allowIncomplete: true });
    await rename(pending, final);
    return { path: final, summary: manifest.summary };
  } catch (error) {
    await writeFile(
      path.join(pending, "failure.json"),
      JSON.stringify({
        complete: false,
        message: "Backup não concluído, corrija a causa e gere uma nova cópia",
      }),
      { mode: 0o600 },
    ).catch(() => {});
    throw error instanceof BackupError
      ? error
      : new BackupError(
          "Não foi possível concluir o backup, a pasta incompleta foi preservada para conferência",
        );
  }
}

async function main() {
  process.umask(0o077);
  if (process.argv.slice(2).some((arg) => arg !== "--check"))
    throw new BackupError("Uso: npm run backup:catalog -- [--check]");
  const config = await loadConfig({ root: projectRoot });
  if (process.argv.includes("--check")) {
    const database = createDatabase(config);
    await database.version();
    const meta = await database.readMetadata();
    if (!meta.bucket)
      throw new BackupError("Bucket product-photos não encontrado");
    await createStorage(config).check();
    console.log(
      "Configuração e ferramentas conferidas, banco e Storage acessíveis, nenhum backup gerado",
    );
    return;
  }
  console.log("Preparando backup, evite editar o catálogo até concluir");
  const result = await createBackup(config);
  console.log(
    `Backup concluído: ${result.path}\n${result.summary.products} produtos, ${result.summary.photos} fotos\nIntegridade conferida, teste de restauração é uma etapa separada`,
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  main().catch((error) => {
    console.error(
      error instanceof BackupError
        ? error.message
        : "Falha no backup, confira configuração e permissões locais",
    );
    process.exitCode = 1;
  });
