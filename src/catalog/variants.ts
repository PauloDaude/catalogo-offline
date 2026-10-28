import type { CatalogSnapshot, Product, Sale } from "./types";
export function saleLabel(sale?: Sale) {
  if (!sale || sale.kind === "unit") return "Unidade";
  return sale.unitsPerPack === 1
    ? `Caixa com ${sale.packCount} unidades`
    : `Caixa com ${sale.packCount} conjuntos de ${sale.unitsPerPack} unidades`;
}
export function selectedVariant(
  parent: Product,
  id: string,
): Product | undefined {
  const v = parent.variants?.find((v) => v.id === id);
  if (!v) return undefined;
  return {
    ...parent,
    id: v.id,
    code: v.code,
    name: `${parent.name} — ${v.label}`,
    hasVariants: false,
    variants: undefined,
    parentId: parent.id,
    variantLabel: v.label,
    priceCents: v.priceCents,
    previousPriceCents: v.previousPriceCents,
    imagePath: v.imagePath || parent.imagePath,
    sale: v.sale,
  };
}
export function purchaseProduct(p: Product): Product {
  return p.sale?.kind === "box" && !p.name.endsWith(` — ${saleLabel(p.sale)}`)
    ? { ...p, name: `${p.name} — ${saleLabel(p.sale)}` }
    : p;
}
export function sellableProducts(products: Product[]): Product[] {
  return products.flatMap((p) =>
    p.hasVariants
      ? (p.variants || []).map((v) =>
          purchaseProduct(selectedVariant(p, v.id)!),
        )
      : [purchaseProduct(p)],
  );
}
export function allImagePaths(
  snapshot: Pick<CatalogSnapshot, "products">,
): string[] {
  return [
    ...new Set(
      snapshot.products.flatMap((p) => [
        p.imagePath,
        ...(p.variants || []).map((v) => v.imagePath || p.imagePath),
      ]),
    ),
  ];
}
export function quantityForParent(
  items: { id: string; parentId?: string; quantity: number }[],
  id: string,
) {
  return items
    .filter((i) => i.id === id || i.parentId === id)
    .reduce((sum, i) => sum + i.quantity, 0);
}
