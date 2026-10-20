import { DropZone, FileTrigger, Text } from "react-aria-components";
import { ImagePlus, ImageUp, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";

export function PhotoPicker({
  image,
  isDisabled,
  isProcessing,
  onSelect,
  onRemove,
}: {
  image?: string;
  isDisabled: boolean;
  isProcessing: boolean;
  onSelect: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  return (
    <div className="photo-field">
      <span id="photo-label">Foto do produto</span>
      <DropZone
        className={`photo-dropzone${image ? " has-image" : ""}`}
        aria-label="Adicionar imagem"
        aria-labelledby="photo-label"
        isDisabled={isDisabled}
        getDropOperation={(types) =>
          ["image/jpeg", "image/png", "image/webp"].some((type) =>
            types.has(type),
          )
            ? "copy"
            : "cancel"
        }
        onDrop={async (e) => {
          if (isDisabled) return;
          const item = e.items.find((item) => item.kind === "file");
          if (item?.kind === "file") await onSelect(await item.getFile());
        }}
      >
        {image ? (
          <img
            className="admin-photo-preview"
            src={image}
            alt="Prévia da foto do produto"
          />
        ) : (
          <>
            <ImagePlus
              aria-hidden="true"
              className="photo-upload-icon"
            />
            <Text slot="label">Arraste uma foto para cá</Text>
            <p>ou escolha uma imagem do seu aparelho</p>
          </>
        )}
        <div className="photo-picker-actions">
          <FileTrigger
            acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
            onSelect={(files) => {
              const file = files?.[0];
              if (file && !isDisabled) void onSelect(file);
            }}
          >
            <Button
              className="touch-button"
              variant={image ? "outline" : "default"}
              isDisabled={isDisabled}
            >
              {image ? (
                <RefreshCw aria-hidden="true" />
              ) : (
                <ImageUp aria-hidden="true" />
              )}
              {image ? "Trocar imagem" : "Escolher imagem"}
            </Button>
          </FileTrigger>
          {image && (
            <Button
              className="touch-button"
              variant="ghost"
              isDisabled={isDisabled}
              onPress={onRemove}
            >
              <Trash2 aria-hidden="true" />
              Remover imagem
            </Button>
          )}
        </div>
      </DropZone>
      <small>
        JPEG, PNG ou WebP, até 20 MB, com ajuste automático para o catálogo
      </small>
      {isProcessing && <p role="status">Preparando imagem…</p>}
    </div>
  );
}
