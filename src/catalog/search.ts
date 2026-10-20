import type { Product, Category } from "./types";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

export function filterProducts(
  products: Product[],
  query: string,
  category: Category | null,
): Product[] {
  const needle = normalize(query);

  return products.filter(
    (p) =>
      (category === null || p.category === category) &&
      normalize(p.name).includes(needle),
  );
}
