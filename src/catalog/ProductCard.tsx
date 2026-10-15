import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Product } from "./types";
import { ProductDialog } from "./ProductDialog";
export const price = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export function ProductCard({
  product,
  image,
}: {
  product: Product;
  image?: string;
}) {
  return (
    <article className="product-card">
      <DialogTrigger>
        <Button
          variant="ghost"
          aria-label={`Ver ${product.name}`}
          className="product-image-button"
        >
          {image ? (
            <img src={image} alt={product.name} loading="lazy" />
          ) : (
            <span className="image-placeholder">Foto indisponível</span>
          )}
          <span className="image-hint">Ver detalhes</span>
        </Button>
        <ProductDialog product={product} image={image} />
      </DialogTrigger>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p className="product-price">{price(product.priceCents)}</p>
      </div>
    </article>
  );
}
