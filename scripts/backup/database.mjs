import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { BackupError } from "./config.mjs";

export function toolCommand(config, tool, args) {
  const url = new URL(config.databaseUrl);
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  const env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    LANG: "C.UTF-8",
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGSSLMODE: local ? "disable" : "require",
    PGCONNECT_TIMEOUT: "15",
    PGOPTIONS:
      "-c default_transaction_read_only=on -c lock_timeout=10000 -c statement_timeout=600000",
  };
  for (const key of [
    "DOCKER_HOST",
    "DOCKER_CONTEXT",
    "DOCKER_CONFIG",
    "XDG_RUNTIME_DIR",
  ])
    if (process.env[key]) env[key] = process.env[key];
  if (config.tools === "native") return { command: tool, args, env };
  return {
    command: "docker",
    args: [
      "run",
      "--rm",
      "--network",
      "host",
      "-i",
      ...Object.keys(env)
        .filter((k) => k.startsWith("PG"))
        .flatMap((k) => ["-e", k]),
      "--entrypoint",
      tool,
      config.image,
      ...args,
    ],
    env,
  };
}

export async function runTool(config, tool, args, { input = "", file } = {}) {
  const command = toolCommand(config, tool, args);
  const child = spawn(command.command, command.args, {
    env: command.env,
    stdio: ["pipe", "pipe", "ignore"],
  });
  const exit = new Promise((resolve, reject) => {
    child.on("error", () =>
      reject(
        new BackupError(
          `Não foi possível iniciar ${tool}, confira as ferramentas locais`,
        ),
      ),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new BackupError(
              `Falha em ${tool}, confira conexão, credenciais e versão PostgreSQL`,
            ),
          ),
    );
  });
  child.stdin.on("error", () => {});
  child.stdin.end(input);
  let output;
  const stdout = file
    ? pipeline(
        child.stdout,
        createWriteStream(file, { mode: 0o600, flags: "wx" }),
      )
    : (async () => {
        const parts = [];
        let size = 0;
        for await (const chunk of child.stdout) {
          size += chunk.length;
          if (size > 64 * 1024 * 1024) {
            child.kill();
            throw new BackupError(
              "Resposta de metadados maior que o limite local",
            );
          }
          parts.push(chunk);
        }
        output = Buffer.concat(parts).toString("utf8").trim();
      })();
  try {
    await Promise.all([exit, stdout]);
  } catch (error) {
    child.kill();
    throw error instanceof BackupError
      ? error
      : new BackupError(`Falha ao gravar a saída de ${tool}`);
  }
  return output;
}

const metadataSql = (hasVariants = false) => `select jsonb_build_object(
 'catalog',jsonb_build_object(
 'variantSchema',${hasVariants},
 'variants',${hasVariants ? "coalesce((select jsonb_agg(to_jsonb(v) order by v.id) from public.product_variants v),'[]'::jsonb)" : "'[]'::jsonb"},
 'products',coalesce((select jsonb_agg(to_jsonb(p) order by p.id) from public.products p),'[]'::jsonb),
 'categories',coalesce((select jsonb_agg(to_jsonb(c) order by c.id) from public.categories c),'[]'::jsonb),
 'admins',coalesce((select jsonb_agg(to_jsonb(a) order by a.user_id) from public.catalog_admins a),'[]'::jsonb),
 'revision',(select revision from public.catalog_state where id),
 'sequence',(select last_value from private.product_code_seq)),
 'objects',coalesce((select jsonb_agg(jsonb_build_object('name',name,'id',id,'updated_at',updated_at,'metadata',metadata) order by name) from storage.objects where bucket_id='product-photos'),'[]'::jsonb),
 'bucket',(select jsonb_build_object('id',id,'name',name,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types) from storage.buckets where id='product-photos'),
 'extensions',coalesce((select jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'schema',n.nspname) order by e.extname) from pg_extension e join pg_namespace n on n.oid=e.extnamespace where n.nspname in ('public','private','auth','storage','supabase_migrations','extensions')),'[]'::jsonb),
 'authUsers',(select count(*) from auth.users)
);`;

export function dumpArguments(extensions = []) {
  if (
    !Array.isArray(extensions) ||
    extensions.some((e) => !/^[a-z0-9_-]+$/.test(e.name))
  )
    throw new BackupError("Inventário de extensões inválido");
  return [
    "--format=custom",
    "--no-owner",
    ...[
      "public",
      "private",
      "auth",
      "storage",
      "supabase_migrations",
      "extensions",
    ].map((schema) => `--schema=${schema}`),
    ...extensions.map((e) => `--extension=${e.name}`),
  ];
}

export function createDatabase(config) {
  return {
    version: async () => {
      const client = await runTool(config, "pg_dump", ["--version"]);
      const rolesClient = await runTool(config, "pg_dumpall", ["--version"]);
      const server = await runTool(
        config,
        "psql",
        ["-X", "-At", "-v", "ON_ERROR_STOP=1"],
        { input: "show server_version;" },
      );
      const clientMajor = Number(client.match(/(\d+)\.\d+/)?.[1]);
      const serverMajor = Number(server.match(/^(\d+)/)?.[1]);
      if (!clientMajor || !serverMajor || clientMajor < serverMajor)
        throw new BackupError(
          "Use ferramentas PostgreSQL de versão igual ou superior à versão do banco",
        );
      return { client, rolesClient, server };
    },
    readMetadata: async () => {
      const variants = await runTool(
        config,
        "psql",
        ["-X", "-qAt", "-v", "ON_ERROR_STOP=1"],
        { input: "select to_regclass('public.product_variants') is not null;" },
      );
      const text = await runTool(
        config,
        "psql",
        ["-X", "-qAt", "-v", "ON_ERROR_STOP=1"],
        { input: metadataSql(variants === "t") },
      );
      try {
        return JSON.parse(text);
      } catch {
        throw new BackupError("Não foi possível ler o inventário do catálogo");
      }
    },
    dump: async (folder, extensions) => {
      await runTool(
        config,
        "pg_dumpall",
        ["--roles-only", "--no-role-passwords"],
        { file: path.join(folder, "roles.sql") },
      );
      await runTool(config, "pg_dump", dumpArguments(extensions), {
        file: path.join(folder, "database.dump"),
      });
    },
  };
}
