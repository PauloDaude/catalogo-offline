import { useState } from "react";
import { SelectField } from "../admin/SelectField";
import { selectedVariant, purchaseProduct } from "./variants";
import { price } from "./price";
import { Dialog, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AddToCartButton } from "../cart/AddToCartButton";

import type { Product } from "./types";
import { ProductPrice } from "./ProductPrice";
import { ProductPhotoViewer } from "./ProductPhotoViewer";

export function ProductDialog({
  product,
  image,
  onAdd,
  quantity,
  images,
  quantityFor,
}: {
  product: Product;
  image?: string;
  onAdd: (product?: Product) => void;
  quantity: number;
  images?: Map<string, string>;
  quantityFor?: (id: string) => number;
}) {
  const [selected, setSelected] = useState(
    product.variants?.length === 1 ? product.variants[0].id : "",
  );
  const chosen = product.hasVariants
    ? selectedVariant(product, selected)
    : product;
  const shown = chosen || product;
  const shownImage = images ? images.get(shown.imagePath) : image;
  const count = chosen ? (quantityFor?.(chosen.id) ?? quantity) : 0;
  return (
    <Dialog
      showCloseButton={false}
      className="product-dialog"
    >
      <div className="product-detail-layout">
        <div className="product-detail-photo">
          {shownImage ? (
            <ProductPhotoViewer
              src={shownImage}
              name={product.name}
            />
          ) : (
            <span className="image-placeholder">Foto indisponível</span>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-dialog-heading">
            <div className="product-meta">
              <span className="product-category">{product.category}</span>
              <span className="product-code">#{shown.code ?? "—"}</span>
            </div>
            <DialogTitle>{product.name}</DialogTitle>
          </div>

          {product.hasVariants && (
            <SelectField
              label={product.variantAttribute || "Opção"}
              value={selected}
              onChange={setSelected}
              options={(product.variants || []).map((v) => ({
                id: v.id,
                name: `${v.label} — ${price(v.priceCents)}`,
              }))}
            />
          )}
          <ProductPrice product={shown} />

          {product.hasVariants && !chosen && (
            <p>Escolha uma opção para adicionar</p>
          )}

          <div className="product-dialog-actions">
            <AddToCartButton
              key={chosen?.id || product.id}
              productName={product.name}
              quantity={count}
              onAdd={() => {
                if (chosen) onAdd(purchaseProduct(chosen));
              }}
              isDisabled={!chosen}
            />

            <DialogClose className="touch-button">Fechar</DialogClose>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
