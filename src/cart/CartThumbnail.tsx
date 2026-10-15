import { useState } from "react";
import { ImageOff } from "lucide-react";

export function CartThumbnail({ src, name }: { src?: string; name: string }) {
  const [failedSource, setFailedSource] = useState<string>();

  if (!src || failedSource === src) {
    return (
      <span
        className="cart-thumbnail cart-thumbnail-placeholder"
        role="img"
        aria-label="Foto indisponível"
      >
        <ImageOff aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      className="cart-thumbnail"
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailedSource(src)}
    />
  );
}
