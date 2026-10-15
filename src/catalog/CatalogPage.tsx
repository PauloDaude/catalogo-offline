import { useState } from "react";
import { Search, ShoppingBag, BookOpen, LayoutGrid } from "lucide-react";
import { TextField } from "react-aria-components";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categories, type Category, type Product } from "./types";
import { filterProducts } from "./search";
import { ProductCard } from "./ProductCard";
import { useCart } from "../cart/useCart";
import { CartPanel } from "../cart/CartPanel";
import { CatalogBook } from "./CatalogBook";

export type CatalogPageProps = {
  products: Product[];
  images: Map<string, string>;
  children?: React.ReactNode;
  catalogReady?: boolean;
};

export function CatalogPage({
  products,
  images,
  children,
  catalogReady = true,
}: CatalogPageProps) {
  const cart = useCart(products, catalogReady);
  const [bookMode, setBookMode] = useState(
    () =>
      new URLSearchParams(window.location.search).get("visualizacao") ===
      "folhear",
  );
  const [announcement, setAnnouncement] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "Todas">("Todas");
  const filtered = filterProducts(products, query, category);
  const productImages = new Map<string, string>();

  for (const product of products) {
    const image = images.get(product.imagePath);
    if (image) productImages.set(product.id, image);
  }

  function changeView() {
    const next = !bookMode;
    const url = new URL(window.location.href);

    if (next) url.searchParams.set("visualizacao", "folhear");
    else url.searchParams.delete("visualizacao");

    window.history.replaceState(window.history.state, "", url);
    setBookMode(next);
  }

  function addProduct(product: Product) {
    cart.add(product);
    setAnnouncement(`${product.name} adicionado ao carrinho.`);
  }

  return (
    <div className={`catalog-shell${bookMode ? " is-book" : ""}`}>
      <header className="site-header">
        <a
          href={import.meta.env.BASE_URL}
          className="brand"
        >
          <span className="brand-icon">
            <ShoppingBag aria-hidden="true" />
          </span>
          <span>
            Catálogo
            <span className="brand-subtitle">
              Produtos para o seu dia a dia
            </span>
          </span>
        </a>
        <Button
          variant="outline"
          className="catalog-view-button touch-button"
          onPress={changeView}
        >
          {bookMode ? (
            <LayoutGrid aria-hidden="true" />
          ) : (
            <BookOpen aria-hidden="true" />
          )}
          {bookMode ? "Visual anterior" : "Folhear catálogo"}
        </Button>
        <CartPanel
          cart={cart}
          productImages={productImages}
        />
      </header>
      <main id="main">
        {!bookMode && (
          <section className="intro">
            <div>
              <p className="eyebrow">SIMPLES, PRÁTICO, PERTO DE VOCÊ</p>
              <h1>
                Encontre o que
                <br className="desktop-break" /> você precisa.
              </h1>
              <p className="intro-description">
                Da cozinha à pescaria, boas opções para facilitar o seu dia.
                Explore os produtos e veja cada detalhe.
              </p>
            </div>
            <aside className="intro-card">
              <ShoppingBag aria-hidden="true" />
              <strong>Seu catálogo, sempre à mão.</strong>
              <p>
                Salve os produtos neste aparelho para consultar mesmo sem
                internet.
              </p>
            </aside>
          </section>
        )}
        {!bookMode && children}
        <p
          className="sr-only"
          aria-live="polite"
        >
          {announcement}
        </p>
        {bookMode ? (
          <CatalogBook
            products={products}
            images={images}
            quantityFor={(id) =>
              cart.items.find((item) => item.id === id)?.quantity ?? 0
            }
            onAdd={addProduct}
          />
        ) : (
          <section
            aria-label="Produtos"
            className="catalog-section"
          >
            <div className="catalog-toolbar">
              <h2>Explore os produtos</h2>
              <TextField
                aria-label="Pesquisar produtos"
                value={query}
                onChange={setQuery}
                className="search-field"
              >
                <Search aria-hidden="true" />
                <Input
                  type="search"
                  placeholder="O que você procura?"
                  className="search-input"
                />
              </TextField>
            </div>
            <nav
              aria-label="Categorias"
              className="category-list"
            >
              {(["Todas", ...categories] as const).map((c) => (
                <Button
                  key={c}
                  variant={category === c ? "default" : "outline"}
                  aria-pressed={category === c}
                  onPress={() => setCategory(c)}
                  className="category-button"
                >
                  {c}
                </Button>
              ))}
            </nav>
            <p
              className="result-count"
              aria-live="polite"
            >
              {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
            </p>
            {filtered.length ? (
              <div className="product-grid">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    image={images.get(product.imagePath)}
                    quantity={
                      cart.items.find((item) => item.id === product.id)
                        ?.quantity ?? 0
                    }
                    onAdd={() => addProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search aria-hidden="true" />
                <h3>Nenhum produto encontrado</h3>
                <p>Tente outro nome ou escolha uma categoria diferente.</p>
                <Button
                  variant="outline"
                  onPress={() => {
                    setQuery("");
                    setCategory("Todas");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </section>
        )}
        {bookMode && <div className="book-sync">{children}</div>}
      </main>
      <footer>
        Catálogo de demonstração · Fotos ilustrativas · Preços fictícios
      </footer>
    </div>
  );
}
