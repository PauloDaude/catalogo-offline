import type { Product } from "./types";
import { price } from "./price";
import { Tag } from "lucide-react";

export function OfferLabel() {
  return (
    <span className="offer-label">
      <Tag aria-hidden="true" />
      <span>Oferta imperdível</span>
    </span>
  );
}

export function ProductPrice({
  product,
  showOfferLabel = true,
}: {
  product: Product;
  showOfferLabel?: boolean;
}) {
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
          {showOfferLabel && <OfferLabel />}
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
