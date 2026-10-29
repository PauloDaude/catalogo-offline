import {
  type CatalogSnapshot,
  type Product,
  type Variant,
  type Sale,
} from "./types";

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
  const codes = new Set<string>();
  const variantIds = new Set<string>();
  const parentIds = new Set(data.products.map((p: any) => p?.id));
  const products = data.products.map((input: unknown) => {
    if (!input || typeof input !== "object")
      throw new Error("Produto inválido");

    const p = input as Product;
    const hasVariants = p.hasVariants === true;
    let variants: Variant[] | undefined;
    if (hasVariants) {
      if (
        !Array.isArray(p.variants) ||
        !p.variants.length ||
        p.variants.length > 50 ||
        !p.variantAttribute?.trim() ||
        p.variantAttribute.length > 80
      )
        throw new Error("Opções inválidas");
      const labels = new Set<string>();
      variants = p.variants.map((v) => {
        if (
          !v ||
          typeof v.id !== "string" ||
          !v.id ||
          parentIds.has(v.id) ||
          variantIds.has(v.id) ||
          typeof v.code !== "string" ||
          !/^P\d{3,12}-V\d{2,12}$/.test(v.code) ||
          !v.code.startsWith(p.code + "-V") ||
          codes.has(v.code) ||
          typeof v.label !== "string" ||
          !v.label.trim() ||
          v.label.length > 80 ||
          labels.has(v.label.trim().toLocaleLowerCase("pt-BR")) ||
          !Number.isSafeInteger(v.priceCents) ||
          v.priceCents < 0 ||
          (v.previousPriceCents !== undefined &&
            (!Number.isSafeInteger(v.previousPriceCents) ||
              v.previousPriceCents <= v.priceCents)) ||
          (v.imagePath !== undefined && !isImagePath(v.imagePath))
        )
          throw new Error("Opção inválida");
        variantIds.add(v.id);
        codes.add(v.code);
        labels.add(v.label.trim().toLocaleLowerCase("pt-BR"));
        return {
          ...v,
          label: v.label.trim(),
          ...(v.sale ? { sale: parseSale(v.sale) } : {}),
        };
      });
    }
    const displayPrice = hasVariants
      ? Math.min(...variants!.map((v) => v.priceCents))
      : p.priceCents;

    if (
      typeof p.id !== "string" ||
      !p.id.trim() ||
      ids.has(p.id) ||
      typeof p.code !== "string" ||
      !/^P\d{3,12}$/.test(p.code) ||
      codes.has(p.code) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      !Number.isSafeInteger(displayPrice) ||
      displayPrice < 0 ||
      (!hasVariants &&
        p.previousPriceCents !== undefined &&
        (!Number.isSafeInteger(p.previousPriceCents) ||
          p.previousPriceCents <= p.priceCents)) ||
      typeof p.category !== "string" ||
      !p.category.trim() ||
      p.category.length > 80 ||
      typeof p.imagePath !== "string" ||
      !isImagePath(p.imagePath)
    )
      throw new Error("Produto inválido");

    ids.add(p.id);
    codes.add(p.code);

    return {
      id: p.id,
      code: p.code,
      name: p.name.trim(),
      priceCents: displayPrice,
      ...(p.hasVariants !== undefined ? { hasVariants } : {}),
      ...(hasVariants
        ? { variants, variantAttribute: p.variantAttribute }
        : {}),
      ...(p.sale ? { sale: parseSale(p.sale) } : {}),
      ...(!hasVariants &&
        p.previousPriceCents !== undefined && {
          previousPriceCents: p.previousPriceCents,
        }),
      category: p.category,
      imagePath: p.imagePath,
    };
  });

  return {
    ...(data.schemaVersion === 2 ? { schemaVersion: 2 as const } : {}),
    revision: Number(data.revision),
    updatedAt: data.updatedAt,
    products,
  };
}

export const isRemoteImagePath = (path: string) =>
  /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$/.test(
    path,
  );

export const isDemoImagePath = (path: string) =>
  /^photos\/[a-zA-Z0-9_-]+\.(jpg|webp)$/.test(path);

export const isImagePath = (path: string) =>
  isDemoImagePath(path) || isRemoteImagePath(path);

export function parseSale(input: unknown): Sale {
  const s = input as Sale;
  if (
    !s ||
    !["unit", "box"].includes(s.kind) ||
    !Number.isInteger(s.packCount) ||
    !Number.isInteger(s.unitsPerPack) ||
    s.packCount < 1 ||
    s.unitsPerPack < 1 ||
    s.packCount * s.unitsPerPack > 100000 ||
    (s.kind === "unit" && (s.packCount !== 1 || s.unitsPerPack !== 1))
  )
    throw new Error("Unidade de venda inválida");
  return { kind: s.kind, packCount: s.packCount, unitsPerPack: s.unitsPerPack };
}
