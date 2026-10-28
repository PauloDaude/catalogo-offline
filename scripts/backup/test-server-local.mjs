import assert from "node:assert/strict";
import { createServer } from "vite";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const name = `boundary-${crypto.randomUUID()}.txt`,
  file = path.join(root, "backups", name);
await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
await writeFile(file, "backup-test-marker", { mode: 0o600, flag: "wx" });
let server;
try {
  server = await createServer({
    root,
    logLevel: "silent",
    server: { host: "127.0.0.1", port: 0, hmr: false },
  });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  for (const url of [`/backups/${name}`, `/@fs/${file}`]) {
    const response = await fetch(base + url);
    assert.equal(
      response.status,
      403,
      "o servidor deve bloquear arquivos de backup",
    );
    assert.ok(!(await response.text()).includes("backup-test-marker"));
  }
  console.log(
    "PASS: arquivos de backups bloqueados pelo servidor de desenvolvimento",
  );
} finally {
  await server?.close();
  await unlink(file);
}
