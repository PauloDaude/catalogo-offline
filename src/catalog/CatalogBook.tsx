import { useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Search, MoveHorizontal } from "lucide-react";
import { TextField } from "react-aria-components";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Product } from "./types";
import { filterProducts } from "./search";
import { ProductPrice } from "./ProductPrice";
import { ProductDialog } from "./ProductDialog";
import { useSwipeNavigation } from "./useSwipeNavigation";

export function CatalogBook({
  products,
  images,
  quantityFor,
  onAdd,
}: {
  products: Product[];
  images: Map<string, string>;
  quantityFor: (id: string) => number;
  onAdd: (product: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState(0);
  const [photo, setPhoto] = useState({ source: "", ratio: 1 });
  const filtered = filterProducts(products, query, "Cozinha");
  const index = Math.min(position, Math.max(0, filtered.length - 1));
  const product = filtered[index];
  const image = product ? images.get(product.imagePath) : undefined;
  const swipe = useSwipeNavigation(
    () => go(1),
    () => go(-1),
  );

  function go(delta: number) {
    setPosition(Math.max(0, Math.min(index + delta, filtered.length - 1)));
  }

  function resetSearch(value: string) {
    setQuery(value);
    setPosition(0);
  }

  return (
    <section
      className="catalog-book"
      aria-label="Catálogo para folhear"
    >
      <div className="book-toolbar">
        <div className="book-category-heading">
          <span className="book-section-number">CATÁLOGO PARA FOLHEAR</span>
          <h1>Cozinha</h1>
        </div>
        <TextField
          aria-label="Pesquisar na categoria Cozinha"
          value={query}
          onChange={resetSearch}
          className="search-field"
        >
          <Search aria-hidden="true" />
          <Input
            type="search"
            placeholder="Pesquisar em Cozinha"
            className="search-input"
          />
        </TextField>
      </div>

      <p className="book-swipe-hint">
        <MoveHorizontal aria-hidden="true" />
        Arraste para a direita para avançar. Toque para ver detalhes.
      </p>

      {product ? (
        <div
          className="book-products book-viewport"
          role="region"
          aria-roledescription="carrossel"
          aria-label="Produtos de Cozinha"
          {...swipe.handlers}
        >
          <article
            key={product.id}
            className="book-product"
            style={
              {
                "--photo-ratio": photo.source === image ? photo.ratio : 1,
                transform: `translateX(${swipe.offset}px)`,
              } as CSSProperties
            }
          >
            <DialogTrigger>
              <Button
                variant="ghost"
                className="product-card-trigger"
                aria-label={`Ver ${product.name}`}
              />
              <ProductDialog
                product={product}
                image={image}
                quantity={quantityFor(product.id)}
                onAdd={() => onAdd(product)}
              />
            </DialogTrigger>

            <div className="book-product-photo">
              {image ? (
                <img
                  src={image}
                  alt={product.name}
                  draggable={false}
                  onLoad={({ currentTarget }) => {
                    const { naturalWidth, naturalHeight } = currentTarget;

                    if (naturalWidth > 0 && naturalHeight > 0) {
                      setPhoto({
                        source: image,
                        ratio: naturalWidth / naturalHeight,
                      });
                    }
                  }}
                />
              ) : (
                <span className="image-placeholder">Foto indisponível</span>
              )}
            </div>
            <div className="book-product-caption">
              <div className="book-product-reference">
                <span className="product-code">#{product.code}</span>
                <span>Cozinha</span>
              </div>
              <h2>{product.name}</h2>
              <ProductPrice product={product} />
            </div>
          </article>
        </div>
      ) : (
        <div className="empty-state book-empty">
          <Search aria-hidden="true" />
          <h2>Nenhum produto encontrado</h2>
          <p>Tente outro nome nesta categoria.</p>
          <Button
            variant="outline"
            onPress={() => resetSearch("")}
          >
            Limpar pesquisa
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
          Produto {product ? index + 1 : 0} de {filtered.length}
        </span>
        <Button
          variant="outline"
          className="touch-button"
          aria-label="Próximo produto"
          isDisabled={index >= filtered.length - 1 || !product}
          onPress={() => go(1)}
        >
          Próximo
          <ArrowRight aria-hidden="true" />
        </Button>
      </nav>
    </section>
  );
}
