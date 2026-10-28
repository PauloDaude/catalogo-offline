import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { loadPilot, buildPayload, importPilot } from "./catalog-import.mjs";
const root = process.cwd();
test("piloto tem cinco pais, oito opções e preços de caixa sem dupla multiplicação", async () => {
  const pilot = await loadPilot(root);
  assert.equal(pilot.produtos.length, 5);
  const cats = new Map([
    ["Cozinha", "c"],
    ["Ferramentas", "f"],
  ]);
  const payload = await buildPayload(
    pilot.produtos[3],
    cats,
    async () => "products/00000000-0000-0000-0000-000000000001.jpg",
  );
  assert.deepEqual(
    payload.variants.map((v) => v.price_cents),
    [3180, 3060, 2940],
  );
  assert.equal(payload.active, false);
  assert.equal(
    (await buildPayload(pilot.produtos[2], cats, async () => "p")).price_cents,
    4890,
  );
  await assert.rejects(
    buildPayload(
      { ...pilot.produtos[0], categoria: "Ausente" },
      cats,
      async () => "p",
    ),
  );
});
test("resposta perdida pode ser repetida com mesmo payload e sem outra criação", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "catalog-import-"));
  let created = 0,
    attempts = 0;
  const rows = new Map(),
    payloads = [];
  const api = {
    categories: async () =>
      new Map([
        ["Cozinha", "c"],
        ["Ferramentas", "f"],
      ]),
    photo: async () => {},
    save: async (key, payload) => {
      payloads.push(JSON.stringify(payload));
      if (!rows.has(key)) {
        rows.set(key, {
          id: `p${++created}`,
          code: `P${created}`,
          variants: [],
        });
        if (attempts++ === 0) throw Error("resposta perdida");
      }
      return rows.get(key);
    },
  };
  const pilot = await loadPilot(root);
  const options = {
    root,
    journalDir: temp,
    manifest: pilot,
    api,
    prepare: async (_source) => ({
      path: "products/00000000-0000-0000-0000-000000000001.jpg",
      bytes: Buffer.from("jpg"),
    }),
    verify: false,
  };
  await assert.rejects(importPilot(options));
  await importPilot(options);
  assert.equal(created, 5);
  assert.equal(payloads[0], payloads[1]);
  await importPilot(options);
  assert.equal(created, 5);
  const journal = await readFile(path.join(temp, "journal.json"), "utf8");
  assert.ok(!journal.includes("password"));
  await rm(temp, { recursive: true, force: true });
});
