import type { Product } from "./types";
import { price } from "./price";
import { Tag } from "lucide-react";

export function ProductPrice({ product }: { product: Product }) {
  const { priceCents, previousPriceCents } = product;
  const hasOffer =
    Number.isSafeInteger(previousPriceCents) &&
    previousPriceCents !== undefined &&
    previousPriceCents > priceCents;
  // Integer arithmetic avoids rounding a discount up, even at the cents limit.
  const discount = hasOffer
    ? Number(
        (BigInt(previousPriceCents - priceCents) * 100n) /
          BigInt(previousPriceCents),
      )
    : 0;

  return (
    <div className={`product-pricing${hasOffer ? " has-offer" : ""}`}>
      {hasOffer && (
        <>
          <span className="offer-label">
            <Tag aria-hidden="true" />
            <span>Oferta imperdível</span>
          </span>
          <p className="previous-price">
            <span className="sr-only">Preço anterior: </span>
            <s>{price(previousPriceCents)}</s>
          </p>
        </>
      )}

      <div className="price-line">
        <p className="product-price">{price(priceCents)}</p>
        {hasOffer && discount > 0 && (
          <span
            className="discount-badge"
            aria-label={`${discount}% de desconto`}
          >
            {discount}% OFF
          </span>
        )}
      </div>
    </div>
  );
}
