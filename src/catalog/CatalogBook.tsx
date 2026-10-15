import { useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Search, MoveHorizontal } from "lucide-react";
import { TextField } from "react-aria-components";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categories, type Product, type Category } from "./types";
import { filterProducts } from "./search";
import { CatalogBookProduct } from "./CatalogBookProduct";
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
  const [perPage, setPerPage] = useState(1);
  const [category, setCategory] = useState<Category | "Todas">("Cozinha");
  const filtered = filterProducts(products, query, category);
  const pages = Math.ceil(filtered.length / perPage);
  const index = Math.min(position, Math.max(0, pages - 1));
  const start = index * perPage;
  const visible = filtered.slice(start, start + perPage);
  const swipe = useSwipeNavigation(
    () => go(1),
    () => go(-1),
  );

  function go(delta: number) {
    setPosition(Math.max(0, Math.min(index + delta, pages - 1)));
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
          <h1>{category === "Todas" ? "Todos os produtos" : category}</h1>
        </div>
        <TextField
          aria-label={`Pesquisar em ${category === "Todas" ? "todas as categorias" : category}`}
          value={query}
          onChange={resetSearch}
          className="search-field"
        >
          <Search aria-hidden="true" />
          <Input
            type="search"
            placeholder={
              category === "Todas"
                ? "Pesquisar produtos"
                : `Pesquisar em ${category}`
            }
            className="search-input"
          />
        </TextField>
      </div>

      <div className="book-display-controls">
        <span id="book-density-label">Produtos por tela</span>
        <div
          role="group"
          aria-labelledby="book-density-label"
          className="book-density-options"
        >
          {[1, 2, 3, 4, 5].map((count) => (
            <Button
              key={count}
              variant={perPage === count ? "default" : "outline"}
              className="touch-button"
              aria-label={`Mostrar ${count} ${count === 1 ? "produto" : "produtos"} por tela`}
              aria-pressed={perPage === count}
              onPress={() => {
                setPerPage(count);
                setPosition(0);
              }}
            >
              {count}
            </Button>
          ))}
        </div>
      </div>
      <div
        role="group"
        aria-label="Categorias do catálogo para folhear"
        className="book-category-options"
      >
        {(["Todas", ...categories] as const).map((value) => (
          <Button
            key={value}
            variant={category === value ? "default" : "outline"}
            className="touch-button"
            aria-pressed={category === value}
            onPress={() => {
              setCategory(value);
              setPosition(0);
            }}
          >
            {value}
          </Button>
        ))}
      </div>

      <p className="book-swipe-hint">
        <MoveHorizontal aria-hidden="true" />
        Arraste para a esquerda para avançar. Toque para ver detalhes.
      </p>

      {visible.length > 0 ? (
        <div
          className="book-products book-viewport"
          role="region"
          aria-roledescription="carrossel"
          aria-label={
            category === "Todas"
              ? "Produtos de todas as categorias"
              : `Produtos de ${category}`
          }
          {...swipe.handlers}
        >
          <div
            className={`book-grid${perPage > 1 ? " is-multiple" : ""}`}
            style={
              {
                "--products-per-page": perPage,
                transform: `translateX(${swipe.offset}px)`,
              } as CSSProperties
            }
          >
            {visible.map((product) => (
              <CatalogBookProduct
                key={product.id}
                product={product}
                image={images.get(product.imagePath)}
                quantity={quantityFor(product.id)}
                onAdd={onAdd}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state book-empty">
          <Search aria-hidden="true" />
          <h2>Nenhum produto encontrado</h2>
          <p>Tente outro nome ou categoria.</p>
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
          isDisabled={index === 0 || visible.length === 0}
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
          {perPage === 1
            ? `Produto ${visible.length ? start + 1 : 0} de ${filtered.length}`
            : `Produtos ${visible.length ? start + 1 : 0}–${start + visible.length} de ${filtered.length}`}
        </span>
        <Button
          variant="outline"
          className="touch-button"
          aria-label="Próximo produto"
          isDisabled={index >= pages - 1 || visible.length === 0}
          onPress={() => go(1)}
        >
          Próximo
          <ArrowRight aria-hidden="true" />
        </Button>
      </nav>
    </section>
  );
}
