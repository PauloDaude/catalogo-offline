import { useState } from "react";
import { ArrowLeft, ArrowRight, Search, MoveHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Product, Category } from "./types";
import { CatalogBookProduct } from "./CatalogBookProduct";
import { useSwipeNavigation } from "./useSwipeNavigation";

export function CatalogBook({
  products,
  images,
  category,
  onClearFilters,
  quantityFor,
  onAdd,
}: {
  products: Product[];
  images: Map<string, string>;
  category: Category | null;
  onClearFilters: () => void;
  quantityFor: (id: string) => number;
  onAdd: (product: Product) => void;
}) {
  const [position, setPosition] = useState(0);
  const index = Math.min(position, Math.max(0, products.length - 1));
  const product = products[index];
  const swipe = useSwipeNavigation(
    () => go(1),
    () => go(-1),
  );

  function go(delta: number) {
    setPosition(Math.max(0, Math.min(index + delta, products.length - 1)));
  }

  return (
    <section
      className="catalog-book"
      aria-label="Catálogo para folhear"
    >
      <p className="book-swipe-hint">
        <MoveHorizontal aria-hidden="true" />
        Arraste para a esquerda para avançar. Toque para ver detalhes.
      </p>

      {product ? (
        <div
          className="book-products book-viewport"
          role="region"
          aria-roledescription="carrossel"
          aria-label={
            category === null
              ? "Produtos de todas as categorias"
              : `Produtos de ${category}`
          }
          {...swipe.handlers}
        >
          <div
            className="book-product-stage"
            style={{ transform: `translateX(${swipe.offset}px)` }}
          >
            <CatalogBookProduct
              product={product}
              image={images.get(product.imagePath)}
              quantity={quantityFor(product.id)}
              onAdd={onAdd}
              onPrevious={() => go(-1)}
              onNext={() => go(1)}
              isFirst={index === 0}
              isLast={index === products.length - 1}
            />
          </div>
        </div>
      ) : (
        <div className="empty-state book-empty">
          <Search aria-hidden="true" />
          <h2>Nenhum produto encontrado</h2>
          <p>Tente outro nome ou categoria.</p>
          <Button
            variant="outline"
            onPress={onClearFilters}
          >
            Limpar filtros
          </Button>
        </div>
      )}

      <nav
        className="book-pagination"
        aria-label="Navegação do carrossel"
      >
        <Button
          variant="outline"
          className="touch-button"
          aria-label="Produto anterior"
          isDisabled={index === 0 || !product}
          onPress={() => go(-1)}
        >
          <ArrowLeft aria-hidden="true" />
          Anterior
        </Button>
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Produto {product ? index + 1 : 0} de {products.length}
        </span>
        <Button
          variant="outline"
          className="touch-button"
          aria-label="Próximo produto"
          isDisabled={index >= products.length - 1 || !product}
          onPress={() => go(1)}
        >
          Próximo
          <ArrowRight aria-hidden="true" />
        </Button>
      </nav>
    </section>
  );
}
