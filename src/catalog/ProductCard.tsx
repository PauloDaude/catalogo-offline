import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";

import type { Product } from "./types";
import { ProductDialog } from "./ProductDialog";
import { OfferLabel, ProductPrice } from "./ProductPrice";

export function ProductCard({
  product,
  image,
  onAdd,
  quantity = 0,
}: {
  product: Product;
  image?: string;
  onAdd: () => void;
  quantity?: number;
}) {
  return (
    <article className="product-card">
      <DialogTrigger>
        <Button
          variant="ghost"
          aria-label={`Ver ${product.name}`}
          className="product-card-trigger"
        />
        <ProductDialog
          product={product}
          image={image}
          onAdd={onAdd}
          quantity={quantity}
        />
      </DialogTrigger>

      <div className="product-image">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <span className="image-placeholder">Foto indisponível</span>
        )}
        {product.previousPriceCents !== undefined &&
          product.previousPriceCents > product.priceCents && <OfferLabel />}
        <span className="image-hint">Ver detalhes</span>
      </div>

      <div className="product-info">
        <div className="product-meta">
          <span className="product-category">{product.category}</span>
          <span className="product-code">#{product.code ?? "—"}</span>
        </div>
        <h3>{product.name}</h3>
        <ProductPrice
          product={product}
          showOfferLabel={false}
        />
      </div>
    </article>
  );
}
