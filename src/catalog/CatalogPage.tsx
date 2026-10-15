import { useState } from "react";
import { Search, ShoppingBag, BookOpen, LayoutGrid } from "lucide-react";
import { TextField, Tabs, TabList, Tab, TabPanel } from "react-aria-components";

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
      new URLSearchParams(window.location.search).get("visualizacao") !==
      "cards",
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

  function changeView(next: boolean) {
    const url = new URL(window.location.href);

    if (next) url.searchParams.set("visualizacao", "folhear");
    else url.searchParams.set("visualizacao", "cards");

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
        <CartPanel
          cart={cart}
          productImages={productImages}
        />
      </header>
      <main id="main">
        <p
          className="sr-only"
          aria-live="polite"
        >
          {announcement}
        </p>
        <Tabs
          className="catalog-views"
          selectedKey={bookMode ? "folhear" : "cards"}
          onSelectionChange={(key) => changeView(key === "folhear")}
        >
          <h1 className="sr-only">Catálogo de produtos</h1>
          <div className="catalog-view-toolbar">
            <TabList
              aria-label="Visualização do catálogo"
              className="catalog-view-tabs"
            >
              <Tab
                id="folhear"
                className="catalog-view-tab"
              >
                <BookOpen aria-hidden="true" />
                Folhear catálogo
              </Tab>
              <Tab
                id="cards"
                className="catalog-view-tab"
              >
                <LayoutGrid aria-hidden="true" />
                Ver grade
              </Tab>
            </TabList>
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

          <TabPanel
            id="folhear"
            className="catalog-view-panel"
          >
            <CatalogBook
              key={`${category}:${query}`}
              products={filtered}
              category={category}
              onClearFilters={() => {
                setQuery("");
                setCategory("Todas");
              }}
              images={images}
              quantityFor={(id) =>
                cart.items.find((item) => item.id === id)?.quantity ?? 0
              }
              onAdd={addProduct}
            />
          </TabPanel>
          <TabPanel
            id="cards"
            className="catalog-view-panel"
          >
            <section
              aria-label="Produtos"
              className="catalog-section"
            >
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
          </TabPanel>
        </Tabs>
        <div className={bookMode ? "book-sync" : "catalog-sync"}>
          {children}
        </div>
      </main>
      <footer>
        Catálogo de demonstração · Fotos ilustrativas · Preços fictícios
      </footer>
    </div>
  );
}
