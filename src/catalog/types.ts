export const categories = [
  "Cozinha",
  "Pesca",
  "Iluminação",
  "Ferramentas",
  "Outros",
] as const;

export type Category = (typeof categories)[number];

export type Product = {
  id: string;
  name: string;
  priceCents: number;
  category: Category;
  imagePath: string;
};

export type CatalogSnapshot = {
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
  getPhoto(path: string, signal?: AbortSignal): Promise<Blob>;
};

export type SyncProgress = {
  phase: "checking" | "downloading" | "activating";
  completed: number;
  total: number;
};

export type SyncResult = { status: "updated" | "unchanged"; revision: number };
