import { useEffect, useState } from "react";
export function OrderPreview({ preview }: { preview: Blob | null }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!preview) {
      setUrl("");
      return;
    }
    const next = URL.createObjectURL(preview);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [preview]);
  return (
    <div className="order-pdf-preview">
      {url ? (
        <img
          src={url}
          alt="Prévia do topo da primeira página do pedido PDF"
        />
      ) : (
        <p>
          Prévia indisponível, seu PDF está pronto para compartilhar ou baixar
        </p>
      )}
    </div>
  );
}
