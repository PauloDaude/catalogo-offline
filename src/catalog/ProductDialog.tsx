import { Dialog, DialogTitle, DialogClose } from "@/components/ui/dialog";
import type { Product } from "./types";
import { price } from "./ProductCard";
export function ProductDialog({
  product,
  image,
}: {
  product: Product;
  image?: string;
}) {
  return (
    <Dialog showCloseButton={false} className="product-dialog">
      <DialogTitle>{product.name}</DialogTitle>
      {image && <img src={image} alt={product.name} className="dialog-image" />}
      <p className="product-price">{price(product.priceCents)}</p>
      <DialogClose className="touch-button">Fechar</DialogClose>
    </Dialog>
  );
}
