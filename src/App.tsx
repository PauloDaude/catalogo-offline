import { useEffect, useState } from 'react';
import { createHttpSource } from './catalog/source';
import type { Product } from './catalog/types';
import { CatalogPage } from './catalog/CatalogPage';
const source = createHttpSource(import.meta.env.BASE_URL);
export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { const controller = new AbortController(); source.getSnapshot(controller.signal).then(s => setProducts(s.products)).catch(() => {}); return () => controller.abort(); }, []);
  return <CatalogPage products={products} images={new Map(products.map(p => [p.imagePath, `${import.meta.env.BASE_URL}demo/${p.imagePath}`]))} />;
}
