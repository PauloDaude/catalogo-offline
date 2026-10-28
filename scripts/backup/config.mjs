import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";

export class BackupError extends Error {}
export async function loadConfig({
  root = process.cwd(),
  env = process.env,
} = {}) {
  const file = path.join(root, ".env.backup");
  let local = {};
  try {
    const stat = await lstat(file);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      (process.platform !== "win32" && stat.mode & 0o077)
    )
      throw new BackupError(
        "Proteja .env.backup executando chmod 600 .env.backup",
      );
    local = parseEnv(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT")
      throw error instanceof BackupError
        ? error
        : new BackupError("Não foi possível ler .env.backup");
  }
  const values = { ...local, ...env };
  for (const name of [
    "BACKUP_DATABASE_URL",
    "BACKUP_SUPABASE_URL",
    "BACKUP_STORAGE_KEY",
  ])
    if (!values[name])
      throw new BackupError(`Configure ${name} em .env.backup`);
  let database, api;
  try {
    database = new URL(values.BACKUP_DATABASE_URL);
    api = new URL(values.BACKUP_SUPABASE_URL);
  } catch {
    throw new BackupError("Endereço do banco ou do Supabase inválido");
  }
  const loopback = (host) => ["127.0.0.1", "localhost", "[::1]"].includes(host);
  if (
    !["postgres:", "postgresql:"].includes(database.protocol) ||
    !database.password ||
    !database.username ||
    !database.pathname.slice(1)
  )
    throw new BackupError(
      "Configure uma conexão PostgreSQL com usuário, senha e banco",
    );
  if (
    (api.protocol !== "https:" &&
      !(api.protocol === "http:" && loopback(api.hostname))) ||
    api.username ||
    api.password ||
    api.search ||
    api.hash ||
    api.pathname !== "/"
  )
    throw new BackupError(
      "Use a URL HTTPS do projeto Supabase, sem credenciais ou caminho",
    );
  if (loopback(api.hostname) !== loopback(database.hostname))
    throw new BackupError("Banco e Storage devem pertencer ao mesmo projeto");
  if (!loopback(api.hostname)) {
    const ref = api.hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
    const username = decodeURIComponent(database.username);
    if (
      !ref ||
      !(
        database.hostname === `db.${ref}.supabase.co` ||
        (database.hostname.endsWith(".pooler.supabase.com") &&
          username === `postgres.${ref}`)
      )
    )
      throw new BackupError("Use banco e Storage do mesmo projeto Supabase");
    if (database.port === "6543")
      throw new BackupError(
        "Use conexão direta ou Session pooler na porta 5432, não Transaction pooler",
      );
  }
  const tools = values.BACKUP_PG_TOOLS || "docker";
  if (!["docker", "native"].includes(tools))
    throw new BackupError("BACKUP_PG_TOOLS deve ser docker ou native");
  const image =
    values.BACKUP_POSTGRES_IMAGE ||
    "public.ecr.aws/supabase/postgres:17.11.0.004";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/:@-]+$/.test(image))
    throw new BackupError("Imagem PostgreSQL inválida");
  return {
    root,
    outputDir: path.join(root, "backups"),
    apiUrl: api.origin,
    databaseUrl: database.href,
    storageKey: values.BACKUP_STORAGE_KEY,
    tools,
    image,
  };
}
