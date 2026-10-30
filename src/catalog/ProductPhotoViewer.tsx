import { Expand, X } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

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
      >
        <div className="product-photo-viewer-header">
          <DialogTitle>Foto de {name}</DialogTitle>
          <DialogClose className="touch-button">
            <X aria-hidden="true" />
            Fechar
          </DialogClose>
        </div>
        <img
          src={src}
          alt={name}
          className="product-photo-full"
        />
      </Dialog>
    </DialogTrigger>
  );
}
