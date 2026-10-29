import type { AdminProduct } from "../types";
export type ProductSelectionItem = Pick<
  AdminProduct,
  "id" | "code" | "name" | "active" | "version"
>;
export type ProductSelection = Map<string, ProductSelectionItem>;
export function toggleProduct(
  selected: ProductSelection,
  product: ProductSelectionItem,
): ProductSelection {
  const next = new Map(selected);
  if (next.has(product.id)) next.delete(product.id);
  else next.set(product.id, { ...product });
  return next;
}
export function pageSelection(
  selected: ProductSelection,
  page: ProductSelectionItem[],
): "none" | "partial" | "all" {
  const count = page.filter((p) => selected.has(p.id)).length;
  return count === 0 ? "none" : count === page.length ? "all" : "partial";
}
export function togglePage(
  selected: ProductSelection,
  page: ProductSelectionItem[],
): ProductSelection {
  const next = new Map(selected),
    all = pageSelection(selected, page) === "all";
  for (const p of page) {
    if (all) next.delete(p.id);
    else if (!next.has(p.id)) next.set(p.id, { ...p });
  }
  return next;
}
