import { saleLabel } from "./variants";
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
  if (product.hasVariants) {
    const options = product.variants || [],
      different = new Set(options.map((v) => v.priceCents)).size > 1;
    return (
      <div className="product-pricing">
        {options.some((v) => v.previousPriceCents !== undefined) && (
          <span className="offer-label">Opções em oferta</span>
        )}
        {different && <span className="price-from">A partir de</span>}
        <p className="product-price">{price(product.priceCents)}</p>
        <p className="variant-summary">{options.length} opções</p>
      </div>
    );
  }
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
      {product.sale?.kind === "box" && (
        <p className="sale-unit">{saleLabel(product.sale)}</p>
      )}
    </div>
  );
}
