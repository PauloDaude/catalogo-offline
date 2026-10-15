import { Dialog, DialogTitle, DialogClose } from "@/components/ui/dialog";
import type { Product } from "./types";
import { price } from "./price";
import { Button } from "@/components/ui/button";

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
      <DialogTitle>{product.name}</DialogTitle>
      <p className="product-code">Código {product.code ?? "—"}</p>
      {image && (
        <img
          src={image}
          alt={product.name}
          className="dialog-image"
        />
      )}
      <p className="product-price">{price(product.priceCents)}</p>
      <Button
        className="touch-button"
        isDisabled={quantity >= 999}
        onPress={onAdd}
      >
        Adicionar ao carrinho{quantity > 0 ? ` (${quantity} na seleção)` : ""}
      </Button>
      <DialogClose className="touch-button">Fechar</DialogClose>
    </Dialog>
  );
}
