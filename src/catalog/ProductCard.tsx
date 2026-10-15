import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Product } from "./types";
import { ProductDialog } from "./ProductDialog";
import { price } from "./price";

import { Plus } from "lucide-react";

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
          className="product-image-button"
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
            />
          ) : (
            <span className="image-placeholder">Foto indisponível</span>
          )}
          <span className="image-hint">Ver detalhes</span>
        </Button>
        <ProductDialog
          product={product}
          image={image}
          onAdd={onAdd}
          quantity={quantity}
        />
      </DialogTrigger>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <span className="product-code">Código {product.code ?? "—"}</span>
        <h3>{product.name}</h3>
        <p className="product-price">{price(product.priceCents)}</p>
        <Button
          variant="outline"
          className="add-to-cart touch-button"
          aria-label={`Adicionar ${product.name}`}
          isDisabled={quantity >= 999}
          onPress={onAdd}
        >
          <Plus aria-hidden="true" />
          Adicionar
          {quantity > 0 && <span className="added-count">{quantity}</span>}
        </Button>
      </div>
    </article>
  );
}
