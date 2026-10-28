export const categories = [
  "Cozinha",
  "Pesca",
  "Iluminação",
  "Ferramentas",
  "Outros",
] as const;

export type Category = string;

export type Sale = {
  kind: "unit" | "box";
  packCount: number;
  unitsPerPack: number;
};
export type Variant = {
  id: string;
  code: string;
  label: string;
  priceCents: number;
  previousPriceCents?: number;
  imagePath?: string;
  sale?: Sale;
};
export type Product = {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  previousPriceCents?: number;
  category: Category;
  imagePath: string;
  hasVariants?: boolean;
  variantAttribute?: string;
  variants?: Variant[];
  sale?: Sale;
  parentId?: string;
  variantLabel?: string;
};

export type CatalogSnapshot = {
  schemaVersion?: 2;
  revision: number;
  updatedAt: string;
  products: Product[];
};

export type LocalCatalog = {
  snapshot: CatalogSnapshot;
  activatedAt: string;
  checkedAt: string;
  photos: Map<string, Blob>;
};

export type CatalogSource = {
  getSnapshot(signal?: AbortSignal): Promise<CatalogSnapshot>;
  getRevision(signal?: AbortSignal): Promise<number>;
  photoUrl?(path: string): string;
  getPhoto(path: string, signal?: AbortSignal): Promise<Blob>;
};

export type SyncProgress = {
  phase: "checking" | "downloading" | "activating";
  completed: number;
  total: number;
};

export type SyncResult = { status: "updated" | "unchanged"; revision: number };
