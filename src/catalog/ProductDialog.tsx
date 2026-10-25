import { Dialog, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AddToCartButton } from "../cart/AddToCartButton";

import type { Product } from "./types";
import { ProductPrice } from "./ProductPrice";

export function ProductDialog({
  product,
  image,
  onAdd,
  quantity,
}: {
  product: Product;
  image?: string;
  onAdd: () => void;
  quantity: number;
}) {
  return (
    <Dialog
      showCloseButton={false}
      className="product-dialog"
    >
      <div className="product-detail-layout">
        <div className="product-detail-photo">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="dialog-image"
            />
          ) : (
            <span className="image-placeholder">Foto indisponível</span>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-dialog-heading">
            <div className="product-meta">
              <span className="product-category">{product.category}</span>
              <span className="product-code">#{product.code ?? "—"}</span>
            </div>
            <DialogTitle>{product.name}</DialogTitle>
          </div>

          <ProductPrice product={product} />

          <div className="product-dialog-actions">
            <AddToCartButton
              key={product.id}
              productName={product.name}
              quantity={quantity}
              onAdd={onAdd}
            />

            <DialogClose className="touch-button">Fechar</DialogClose>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
