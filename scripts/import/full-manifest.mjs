import { readFile, lstat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

function groupKey(p) {
  if (p.familia === "Tesoura")
    return p.familia + (p.nome.includes("polegadas") ? " polegadas" : " cm");
  return p.familia;
}
function label(p) {
  if (p.familia === "Escova para cabelo")
    return p.id_importacao === "WA0595-01" ? "Modelo 1" : "Modelo 2";
  if (p.familia === "Lanterna Original")
    return p.id_importacao === "WA0589-01" ? "GD 5 W" : p.variacao.potencia;
  if (p.familia === "Calculadora") return p.nome.replace(/^Calculadora /, "");
  if (p.familia === "Elástico para moto")
    return p.nome.replace(/^Elástico para moto /, "");
  if (p.familia === "Escova dental")
    return p.nome.replace(/^Escova dental /, "");
  if (p.familia === "Tesoura para unha")
    return p.nome.replace(/^Tesoura para unha /, "");
  if (p.familia === "Tubo de látex")
    return `${p.variacao.modelo} · ${p.variacao.comprimento}`;
  return Object.values(p.variacao || {}).join(" · ");
}
export function buildFullManifest(source, active) {
  const groups = new Map();
  for (const p of source.produtos) {
    const key = groupKey(p);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  const produtos = [];
  for (const [name, rows] of groups) {
    const row = (r) => ({
      origens: [r.id_importacao],
      nome_origem: r.nome,
      preco_centavos: r.preco_centavos,
      preco_anterior_centavos: null,
      imagem: r.imagem,
      venda: r.venda,
    });
    const p = {
      chave_importacao: `lote-completo-20261029-v1:${rows[0].id_importacao}`,
      nome: rows.length > 1 ? name : rows[0].nome,
      categoria: rows[0].categoria,
      ativo: active,
      tem_variantes: rows.length > 1,
      imagem: rows[0].imagem,
      origens: rows.map((r) => r.id_importacao),
    };
    if (rows.length === 1) Object.assign(p, row(rows[0]));
    else {
      p.caracteristica = name.includes("Lanterna")
        ? "Potência"
        : name.includes("Tesoura") ||
            name === "Tábua" ||
            name === "Xuxinha" ||
            name === "Coador para café" ||
            name === "Cortador de unha SQ"
          ? "Tamanho"
          : "Opção";
      p.variantes = rows.map((r) => ({
        ...row(r),
        chave_opcao: r.id_importacao,
        rotulo: label(r),
      }));
    }
    produtos.push(p);
  }
  return {
    formato: "cirandinha-lote-completo",
    versao: 1,
    lote: "lote-completo-20261029-v1",
    origens: 85,
    produtos,
  };
}
export async function validateFullManifest(manifest, root = process.cwd()) {
  const source = JSON.parse(
    await readFile(
      path.join(root, "docs/produtos/produtos-preparados.json"),
      "utf8",
    ),
  );
  const active = manifest.produtos?.[0]?.ativo;
  if (
    typeof active !== "boolean" ||
    JSON.stringify(manifest) !==
      JSON.stringify(buildFullManifest(source, active))
  )
    throw Error("Manifesto difere dos 85 registros comerciais preparados");
  const report = JSON.parse(
    await readFile(
      path.join(root, "docs/produtos/conversao-webp.json"),
      "utf8",
    ),
  );
  const origins = new Set();
  for (const p of manifest.produtos) {
    const labels = new Set();
    for (const row of p.tem_variantes ? p.variantes : [p]) {
      const id = row.origens[0];
      if (origins.has(id)) throw Error("Origem duplicada");
      origins.add(id);
      if (p.tem_variantes) {
        if (!row.rotulo || labels.has(row.rotulo))
          throw Error("Opção vazia ou repetida");
        labels.add(row.rotulo);
      }
      if (!/^imagens-webp\/IMG-\d{8}-WA\d{4}\.webp$/.test(row.imagem))
        throw Error("Caminho WebP inválido");
      const filename = path.join(root, "docs/produtos", row.imagem);
      const stat = await lstat(filename);
      const bytes = await readFile(filename);
      const recorded = report.arquivos.find(
        (r) => r.webp === `docs/produtos/${row.imagem}`,
      );
      if (
        !recorded ||
        recorded.sha256_webp !== digest(bytes) ||
        recorded.largura > 1600 ||
        recorded.altura > 1600
      )
        throw Error("Foto difere da conversão conferida");
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        bytes.length > 500000 ||
        bytes.toString("ascii", 0, 4) !== "RIFF" ||
        bytes.toString("ascii", 8, 12) !== "WEBP"
      )
        throw Error("Foto WebP inválida");
    }
  }
  if (origins.size !== 85) throw Error("Lote incompleto");
  return {
    products: manifest.produtos.length,
    choices: origins.size,
    photos: new Set(source.produtos.map((p) => p.imagem)).size,
    manifestHash: digest(JSON.stringify(manifest)),
  };
}
