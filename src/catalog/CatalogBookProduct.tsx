import { useState, type CSSProperties } from "react";
import { ShoppingCart, Plus, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Product } from "./types";
import { ProductPrice } from "./ProductPrice";
import { ProductDialog } from "./ProductDialog";

export function CatalogBookProduct({
  product,
  image,
  quantity,
  onAdd,
  onPrevious,
  onNext,
  isFirst,
  isLast,
}: {
  product: Product;
  image?: string;
  quantity: number;
  onAdd: (product: Product) => void;
  onPrevious: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [photo, setPhoto] = useState({ source: "", ratio: 1 });

  return (
    <article
      className="book-product"
      style={
        {
          "--photo-ratio": photo.source === image ? photo.ratio : 1,
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
          quantity={quantity}
          onAdd={() => onAdd(product)}
        />
      </DialogTrigger>

      <div className="book-product-photo">
        <Button
          variant="outline"
          className="book-side-arrow book-side-previous"
          aria-label="Voltar produto"
          aria-disabled={isFirst}
          onPress={() => {
            if (!isFirst) onPrevious();
          }}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          className="book-side-arrow book-side-next"
          aria-label="Avançar produto"
          aria-disabled={isLast}
          onPress={() => {
            if (!isLast) onNext();
          }}
        >
          <ChevronRight aria-hidden="true" />
        </Button>

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
          <span>{product.category}</span>
        </div>
        <h2>{product.name}</h2>
        <div className="book-product-purchase">
          <ProductPrice product={product} />
          <Button
            className="book-add-to-cart touch-button"
            aria-label={`Adicionar ${product.name} ao carrinho`}
            onPress={() => onAdd(product)}
          >
            <ShoppingCart aria-hidden="true" />
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}
