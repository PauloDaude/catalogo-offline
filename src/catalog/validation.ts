import { categories, type CatalogSnapshot, type Product } from "./types";

export function parseSnapshot(input: unknown): CatalogSnapshot {
  if (!input || typeof input !== "object") throw new Error("Catálogo inválido");

  const data = input as Record<string, unknown>;

  if (
    !Number.isSafeInteger(data.revision) ||
    Number(data.revision) < 0 ||
    typeof data.updatedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T/.test(data.updatedAt) ||
    !Number.isFinite(Date.parse(data.updatedAt)) ||
    !Array.isArray(data.products)
  )
    throw new Error("Catálogo inválido");

  const ids = new Set<string>();
  const products = data.products.map((input: unknown) => {
    if (!input || typeof input !== "object")
      throw new Error("Produto inválido");

    const p = input as Product;

    if (
      typeof p.id !== "string" ||
      !p.id.trim() ||
      ids.has(p.id) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      !Number.isSafeInteger(p.priceCents) ||
      p.priceCents < 0 ||
      !categories.includes(p.category) ||
      typeof p.imagePath !== "string" ||
      !/^photos\/[a-zA-Z0-9_-]+\.jpg$/.test(p.imagePath)
    )
      throw new Error("Produto inválido");

    ids.add(p.id);

    return {
      id: p.id,
      name: p.name.trim(),
      priceCents: p.priceCents,
      category: p.category,
      imagePath: p.imagePath,
    };
  });

  return {
    revision: Number(data.revision),
    updatedAt: data.updatedAt,
    products,
  };
}
