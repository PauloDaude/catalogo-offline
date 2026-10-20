import { execFileSync, spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
if (new URL(status.API_URL).hostname !== "127.0.0.1")
  throw new Error("Somente ambiente local.");
const service = createClient(
  status.API_URL,
  status.SECRET_KEY || status.SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const suffix = crypto.randomUUID(),
  password = `Test-${crypto.randomUUID()}!Aa1`,
  ids = [];
const emails = [`admin-${suffix}@example.test`, `user-${suffix}@example.test`];
let server;
let activeChild;
process.on("SIGINT", () => {
  activeChild?.kill("SIGINT");
  server?.kill();
});
const sql = (statement) =>
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
      statement,
    ],
    { stdio: "pipe" },
  );
function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const p = spawn(command, args, { env, stdio: "inherit" });
    activeChild = p;
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} saiu com código ${code}`)),
    );
  });
}
try {
  for (const email of emails) {
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error("Falha ao provisionar conta de teste.");
    ids.push(data.user.id);
  }
  sql(`insert into public.catalog_admins values ('${ids[0]}');`);
  const env = {
    ...process.env,
    VITE_CATALOG_SOURCE: "supabase",
    VITE_SUPABASE_URL: status.API_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY || status.ANON_KEY,
    TEST_ADMIN_EMAIL: emails[0],
    TEST_USER_EMAIL: emails[1],
    TEST_PASSWORD: password,
    TEST_PREFIX: suffix,
  };
  const output = ".superpowers/sdd/2026-10-20-painel-administrativo/dist-admin";
  await run("npx", ["vite", "build", "--outDir", output], env);
  server = spawn(
    "node",
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      "4180",
      "--strictPort",
      "--outDir",
      output,
    ],
    { env, stdio: "ignore" },
  );
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null)
      throw new Error("A porta 4180 já está em uso ou o preview falhou.");
    try {
      const r = await fetch("http://127.0.0.1:4180");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!ready) throw new Error("Preview de teste não iniciou.");
  await run(
    "npx",
    [
      "playwright",
      "test",
      "--config",
      "playwright.admin.config.ts",
      ...process.argv.slice(2),
    ],
    env,
  );
} finally {
  server?.kill();
  sql(
    `delete from public.products where category_id in (select id from public.categories where name like '%${suffix}%'); delete from public.categories where name like '%${suffix}%';`,
  );
  for (const id of ids) await service.auth.admin.deleteUser(id);
}
