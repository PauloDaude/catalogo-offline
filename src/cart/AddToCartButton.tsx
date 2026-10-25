import { useEffect, useRef, useState } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import { Button } from "../components/ui/button";

export function AddToCartButton({
  productName,
  quantity,
  onAdd,
  compact = false,
}: {
  productName: string;
  quantity: number;
  onAdd: () => void;
  compact?: boolean;
}) {
  const [pulses, setPulses] = useState<number[]>([]);
  const sequence = useRef(0);
  useEffect(() => {
    if (!pulses.length) return;
    const timer = setTimeout(() => setPulses([]), 1100);
    return () => clearTimeout(timer);
  }, [pulses]);
  return (
    <div className={`cart-add-feedback${compact ? " is-compact" : ""}`}>
      <Button
        className={`touch-button cart-add-button${compact ? " book-add-to-cart" : ""}`}
        aria-label={
          compact ? `Adicionar ${productName} ao carrinho` : undefined
        }
        aria-description={`${quantity} na seleção`}
        isDisabled={quantity >= 999}
        onPress={() => {
          onAdd();
          setPulses((current) => [...current.slice(-4), ++sequence.current]);
        }}
      >
        <ShoppingCart aria-hidden="true" />
        {compact ? (
          <Plus
            className="cart-add-plus"
            aria-hidden="true"
          />
        ) : (
          <>
            Adicionar ao carrinho
            {quantity > 0 ? ` (${quantity} na seleção)` : ""}
          </>
        )}
        {compact && quantity > 0 && (
          <span
            className="cart-product-count"
            aria-label={`${quantity} no carrinho`}
          >
            {quantity}
          </span>
        )}
      </Button>
      {pulses.map((id) => (
        <span
          key={id}
          className="cart-add-pulse"
          aria-hidden="true"
          onAnimationEnd={() =>
            setPulses((current) => current.filter((value) => value !== id))
          }
        >
          +1
        </span>
      ))}
    </div>
  );
}
