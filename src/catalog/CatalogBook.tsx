import { useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Search } from "lucide-react";
import { TextField } from "react-aria-components";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Product } from "./types";
import { filterProducts } from "./search";
import { price } from "./price";
import { ProductDialog } from "./ProductDialog";

function subscribeToSize(onChange: () => void) {
  window.addEventListener("resize", onChange);

  return () => window.removeEventListener("resize", onChange);
}

function getPageSize() {
  return window.innerWidth <= 650 ? 1 : 2;
}

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
  const [firstItem, setFirstItem] = useState(0);
  const pageSize = useSyncExternalStore(subscribeToSize, getPageSize, () => 2);
  const filtered = filterProducts(products, query, "Cozinha");
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageIndex = Math.min(Math.floor(firstItem / pageSize), pageCount - 1);
  const visible = filtered.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );
  const categoryCount = products.filter(
    (product) => product.category === "Cozinha",
  ).length;

  function resetSearch(value: string) {
    setQuery(value);
    setFirstItem(0);
  }

  return (
    <section
      className="catalog-book"
      aria-label="Catálogo para folhear"
    >
      <div className="book-intro">
        <div>
          <h1>Catálogo para folhear</h1>
          <p>Toque em um produto para ampliar e selecionar.</p>
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

      <div className="book-layout">
        <aside className="book-index">
          <p className="book-index-title">
            <BookOpen aria-hidden="true" />
            Categorias
          </p>
          <nav aria-label="Índice do catálogo">
            <Button
              variant="ghost"
              className="book-category touch-button"
              aria-current="page"
              onPress={() => resetSearch("")}
            >
              <span>01</span> Cozinha <small>{categoryCount}</small>
            </Button>
          </nav>
          <p className="book-preview-note">
            Uma prévia do novo catálogo, começando pela cozinha.
          </p>
        </aside>

        <div className="book-sheet">
          <div className="book-sheet-heading">
            <div>
              <span className="book-section-number">01 / COZINHA</span>
              <h2>Para o dia a dia</h2>
            </div>
            <span className="book-product-count">
              {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
            </span>
          </div>

          <nav
            className="book-pagination"
            aria-label="Páginas do catálogo"
          >
            <Button
              variant="outline"
              className="touch-button"
              aria-label="Página anterior"
              isDisabled={pageIndex === 0}
              onPress={() => setFirstItem((pageIndex - 1) * pageSize)}
            >
              <ArrowLeft aria-hidden="true" />
              Anterior
            </Button>
            <span
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              Página {pageIndex + 1} de {pageCount}
            </span>
            <Button
              variant="outline"
              className="touch-button"
              aria-label="Próxima página"
              isDisabled={pageIndex >= pageCount - 1}
              onPress={() => setFirstItem((pageIndex + 1) * pageSize)}
            >
              Próxima
              <ArrowRight aria-hidden="true" />
            </Button>
          </nav>

          {visible.length ? (
            <div className="book-products">
              {visible.map((product) => {
                const image = images.get(product.imagePath);
                const quantity = quantityFor(product.id);
                const hasOffer =
                  product.previousPriceCents !== undefined &&
                  product.previousPriceCents > product.priceCents;

                return (
                  <article
                    key={product.id}
                    className="book-product"
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
                        quantity={quantity}
                        onAdd={() => onAdd(product)}
                      />
                    </DialogTrigger>

                    <div className="book-product-photo">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                        />
                      ) : (
                        <span className="image-placeholder">
                          Foto indisponível
                        </span>
                      )}
                    </div>
                    <div className="book-product-caption">
                      <div className="book-product-reference">
                        <span className="product-code">#{product.code}</span>
                        {hasOffer && (
                          <span className="book-special">Oferta</span>
                        )}
                      </div>
                      <h3>{product.name}</h3>
                      <div className="book-product-pricing">
                        <strong>{price(product.priceCents)}</strong>
                        {hasOffer && (
                          <s aria-label="Preço anterior">
                            {price(product.previousPriceCents!)}
                          </s>
                        )}
                      </div>
                      <span className="book-details-hint">Ver detalhes</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state book-empty">
              <Search aria-hidden="true" />
              <h3>Nenhum produto encontrado</h3>
              <p>Tente outro nome nesta categoria.</p>
              <Button
                variant="outline"
                onPress={() => resetSearch("")}
              >
                Limpar pesquisa
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
