import { Expand } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { ProductPhotoZoom } from "./ProductPhotoZoom";

export function ProductPhotoViewer({
  src,
  name,
}: {
  src: string;
  name: string;
}) {
  return (
    <DialogTrigger>
      <Button
        variant="ghost"
        className="product-photo-trigger"
        aria-label={`Ver foto completa de ${name}`}
      >
        <img
          src={src}
          alt={name}
          className="dialog-image"
        />
        <span
          className="product-photo-hint"
          aria-hidden="true"
        >
          <Expand />
          Ampliar foto
        </span>
      </Button>
      <Dialog
        showCloseButton={false}
        className="product-photo-viewer"
        overlayClassName="product-photo-overlay"
      >
        <div className="product-photo-viewer-header">
          <DialogTitle aria-label={`Foto de ${name}`}>{name}</DialogTitle>
        </div>
        <ProductPhotoZoom
          key={src}
          src={src}
          name={name}
        />
      </Dialog>
    </DialogTrigger>
  );
}
