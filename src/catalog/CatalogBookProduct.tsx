import { LoadingImage } from "../components/LoadingImage";
import { ShoppingCart, Plus } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import type { Product } from "./types";
import { ProductPrice } from "./ProductPrice";
import { AddToCartButton } from "../cart/AddToCartButton";
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
  images,
  quantityFor,
}: {
  product: Product;
  image?: string;
  quantity: number;
  onAdd: (product: Product) => void;
  onPrevious: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  images?: Map<string, string>;
  quantityFor?: (id: string) => number;
}) {
  const [open, setOpen] = useState(false);
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
      <DialogTrigger
        isOpen={open}
        onOpenChange={setOpen}
      >
        <Button
          variant="ghost"
          className="product-card-trigger"
          aria-label={`Ver ${product.name}`}
        />
        <ProductDialog
          key={product.id}
          product={product}
          image={image}
          quantity={quantity}
          onAdd={(selected) => onAdd(selected || product)}
          images={images}
          quantityFor={quantityFor}
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
          <LoadingImage
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
              onAdd={() => onAdd(product)}
              compact
            />
          )}
        </div>
      </div>
    </article>
  );
}
