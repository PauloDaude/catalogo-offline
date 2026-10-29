import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { BackupError } from "./config.mjs";

export const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export function safeRelative(name) {
  if (
    typeof name !== "string" ||
    !name ||
    name.includes("\\") ||
    name.includes("\0") ||
    name.split("/").some((p) => !p || p === "." || p === "..") ||
    path.isAbsolute(name)
  )
    throw new BackupError("Caminho inseguro no backup");
  return name;
}
export function photoPath(name) {
  if (
    !/^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$/.test(
      name,
    )
  )
    throw new BackupError("Caminho de foto inválido no bucket");
  return safeRelative(name);
}
export async function inventory(folder, prefix = "") {
  const files = [];
  for (const entry of await readdir(path.join(folder, prefix), {
    withFileTypes: true,
  })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink())
      throw new BackupError("Links simbólicos não são permitidos no backup");
    if (entry.isDirectory()) files.push(...(await inventory(folder, name)));
    else if (entry.isFile()) {
      const hash = createHash("sha256");
      let size = 0;
      for await (const chunk of createReadStream(path.join(folder, name))) {
        size += chunk.length;
        hash.update(chunk);
      }
      files.push({ path: name, size, sha256: hash.digest("hex") });
    } else throw new BackupError("Tipo de arquivo inválido no backup");
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
export async function verifyBackup(folder, { allowIncomplete = false } = {}) {
  try {
    if (!allowIncomplete && path.basename(folder).endsWith(".incomplete"))
      throw new BackupError("Backup incompleto, gere uma nova cópia");
    if (
      !(await lstat(folder)).isDirectory() ||
      (await lstat(folder)).isSymbolicLink()
    )
      throw new BackupError("Pasta de backup inválida");
    const all = await inventory(folder);
    const manifest = JSON.parse(
      await readFile(path.join(folder, "manifest.json"), "utf8"),
    );
    if (
      manifest.format !== "cirandinha-backup" ||
      ![1, 2].includes(manifest.version) ||
      manifest.complete !== true ||
      !Array.isArray(manifest.files)
    )
      throw new BackupError("Manifesto inválido");
    const expected = manifest.files;
    if (new Set(expected.map((f) => f.path)).size !== expected.length)
      throw new BackupError("Manifesto com caminhos duplicados");
    for (const name of ["database.dump", "roles.sql", "metadata.json"])
      if (!expected.some((f) => f.path === name && f.size > 0))
        throw new BackupError("Arquivo obrigatório ausente");
    const actual = new Map(
      all.filter((f) => f.path !== "manifest.json").map((f) => [f.path, f]),
    );
    if (actual.size !== expected.length)
      throw new BackupError("Falha de integridade, inventário diferente");
    for (const file of expected) {
      safeRelative(file.path);
      const found = actual.get(file.path);
      if (!found || found.sha256 !== file.sha256 || found.size !== file.size)
        throw new BackupError(
          "Falha de integridade, arquivo ausente ou corrompido",
        );
    }
    const meta = JSON.parse(
      await readFile(path.join(folder, "metadata.json"), "utf8"),
    );
    for (const object of meta.objects) {
      photoPath(object.name);
      if (!actual.has(`photos/${object.name}`))
        throw new BackupError("Foto ausente no backup");
    }
    for (const name of photoReferences(meta))
      if (!actual.has(`photos/${name}`))
        throw new BackupError("Foto de produto/opção ausente no backup");
    if (
      manifest.summary.products !== meta.catalog.products.length ||
      manifest.summary.photos !== meta.objects.length
    )
      throw new BackupError("Contagens inválidas no manifesto");
    return manifest;
  } catch (error) {
    throw error instanceof BackupError
      ? error
      : new BackupError(
          "Não foi possível verificar o backup, confira a pasta e os arquivos",
        );
  }
}

export function photoReferences(meta) {
  const parents = new Map(meta.catalog.products.map((p) => [p.id, p]));
  return [
    ...meta.catalog.products.map((p) => photoPath(p.image_path)),
    ...(meta.catalog.variants || []).map((v) => {
      if (!parents.has(v.product_id))
        throw new BackupError("Opção sem produto no backup");
      return photoPath(v.image_path || parents.get(v.product_id).image_path);
    }),
  ];
}
