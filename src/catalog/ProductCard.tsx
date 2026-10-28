import { useState } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";

import type { Product } from "./types";
import { AddToCartButton } from "../cart/AddToCartButton";
import { ProductDialog } from "./ProductDialog";
import { OfferLabel, ProductPrice } from "./ProductPrice";

export function ProductCard({
  product,
  image,
  onAdd,
  quantity = 0,
  images,
  quantityFor,
}: {
  product: Product;
  image?: string;
  onAdd: (product?: Product) => void;
  quantity?: number;
  images?: Map<string, string>;
  quantityFor?: (id: string) => number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="product-card">
      <DialogTrigger
        isOpen={open}
        onOpenChange={setOpen}
      >
        <Button
          variant="ghost"
          aria-label={`Ver ${product.name}`}
          className="product-card-trigger"
        />
        <ProductDialog
          key={product.id}
          product={product}
          image={image}
          onAdd={onAdd}
          quantity={quantity}
          images={images}
          quantityFor={quantityFor}
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
        <div className="product-card-purchase">
          <ProductPrice
            product={product}
            showOfferLabel={false}
          />
          {product.hasVariants ? (
            <Button
              className="touch-button book-add-to-cart"
              aria-label={`Escolher opções de ${product.name}`}
              onPress={() => setOpen(true)}
            >
              <ShoppingCart aria-hidden="true" />
              <Plus aria-hidden="true" />
              {quantity > 0 && (
                <span className="cart-product-count">{quantity}</span>
              )}
            </Button>
          ) : (
            <AddToCartButton
              key={product.id}
              productName={product.name}
              quantity={quantity}
              onAdd={onAdd}
              compact
            />
          )}
        </div>
      </div>
    </article>
  );
}
