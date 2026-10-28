import { useEffect, useState } from "react";
import { TextField, Label, Input, Checkbox } from "react-aria-components";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../ConfirmDialog";
import { PhotoPicker } from "./PhotoPicker";
import { optimizePhoto } from "./photo";
import { SaleFields, type SaleDraft } from "./SaleFields";
import { formatMoneyInput } from "./money";
import type { AdminVariant } from "../types";
export type VariantDraft = SaleDraft & {
  key: string;
  id?: string;
  code?: string;
  version?: number;
  label: string;
  price: string;
  previous: string;
  offer: boolean;
  image_path: string | null;
  photo?: Blob;
  active: boolean;
};
export function variantDraft(v?: AdminVariant): VariantDraft {
  return {
    key: v?.id || crypto.randomUUID(),
    id: v?.id,
    code: v?.code,
    version: v?.version,
    label: v?.label || "",
    price: v ? formatMoneyInput(v.price_cents) : "",
    previous: v?.previous_price_cents
      ? formatMoneyInput(v.previous_price_cents)
      : "",
    offer: !!v?.previous_price_cents,
    image_path: v?.image_path || null,
    active: v?.active ?? true,
    sale_kind: v?.sale_kind || "unit",
    pack_count: v?.pack_count || 1,
    units_per_pack: v?.units_per_pack || 1,
  };
}
function VariantPhoto({
  value,
  parent,
  photoUrl,
  disabled,
  onChange,
  onProcessing,
}: {
  value: VariantDraft;
  parent?: string;
  photoUrl: (path: string) => string;
  disabled: boolean;
  onChange: (row: VariantDraft) => void;
  onProcessing: (busy: boolean) => void;
}) {
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState("");
  useEffect(() => {
    if (!value.photo) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(value.photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value.photo]);
  return (
    <div>
      <PhotoPicker
        image={
          preview || (value.image_path ? photoUrl(value.image_path) : parent)
        }
        isDisabled={disabled}
        isProcessing={disabled}
        onSelect={async (file) => {
          onProcessing(true);
          setError("");
          try {
            const photo = await optimizePhoto(file);
            onChange({ ...value, photo });
          } catch {
            setError("Não foi possível preparar a foto da opção");
          } finally {
            onProcessing(false);
          }
        }}
        onRemove={() =>
          onChange({ ...value, photo: undefined, image_path: null })
        }
      />
      {!value.photo && !value.image_path && <p>Usa a foto principal</p>}
      {error && (
        <p
          role="alert"
          className="admin-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
export function VariantEditor({
  value,
  onChange,
  parentImage,
  photoUrl,
  disabled = false,
  onProcessing,
  onHideLast,
}: {
  value: VariantDraft[];
  onChange: (rows: VariantDraft[]) => void;
  parentImage?: string;
  photoUrl: (path: string) => string;
  disabled?: boolean;
  onProcessing: (busy: boolean) => void;
  onHideLast: () => void;
}) {
  const [hiding, setHiding] = useState<number | null>(null);
  const change = (i: number, row: VariantDraft) =>
    onChange(value.map((v, n) => (n === i ? row : v)));
  return (
    <section className="variant-editor">
      <h2>Opções do produto</h2>
      {value.map((v, i) => (
        <section
          className="variant-editor-row"
          key={v.key}
        >
          <h3>
            Opção {i + 1}
            {v.code ? ` · #${v.code}` : ""}
            {!v.active ? " (oculta)" : ""}
          </h3>
          <TextField
            isRequired
            isDisabled={disabled}
            value={v.label}
            maxLength={80}
            onChange={(label) => change(i, { ...v, label })}
          >
            <Label>Nome da opção {i + 1}</Label>
            <Input />
          </TextField>
          <TextField
            isRequired
            isDisabled={disabled}
            value={v.price}
            onChange={(price) => change(i, { ...v, price })}
          >
            <Label>Preço da opção {i + 1} (R$)</Label>
            <Input inputMode="decimal" />
          </TextField>
          <Checkbox
            className="admin-checkbox"
            isDisabled={disabled}
            isSelected={v.offer}
            onChange={(offer) => change(i, { ...v, offer })}
          >
            <span className="checkbox-mark">{v.offer ? "✓" : ""}</span>Opção{" "}
            {i + 1} em oferta
          </Checkbox>
          {v.offer && (
            <TextField
              isRequired
              isDisabled={disabled}
              value={v.previous}
              onChange={(previous) => change(i, { ...v, previous })}
            >
              <Label>Preço anterior da opção {i + 1} (R$)</Label>
              <Input inputMode="decimal" />
            </TextField>
          )}
          <SaleFields
            value={v}
            onChange={(s) => change(i, { ...v, ...s })}
            suffix={` da opção ${i + 1}`}
            disabled={disabled}
          />
          <VariantPhoto
            value={v}
            parent={parentImage}
            photoUrl={photoUrl}
            disabled={disabled}
            onChange={(row) => change(i, row)}
            onProcessing={onProcessing}
          />
          {!v.id && value.length > 1 && (
            <Button
              variant="outline"
              className="touch-button"
              isDisabled={disabled}
              onPress={() => onChange(value.filter((_, n) => n !== i))}
            >
              Remover linha não salva
            </Button>
          )}
          <Button
            variant="outline"
            className="touch-button"
            isDisabled={disabled}
            onPress={() =>
              v.active ? setHiding(i) : change(i, { ...v, active: true })
            }
          >
            {v.active ? "Ocultar opção" : "Mostrar opção"}
          </Button>
        </section>
      ))}
      <Button
        variant="outline"
        className="touch-button"
        isDisabled={disabled || value.length >= 50}
        onPress={() => onChange([...value, variantDraft()])}
      >
        Adicionar opção
      </Button>
      {hiding !== null && (
        <ConfirmDialog
          isOpen
          title="Ocultar opção?"
          confirmLabel="Ocultar opção"
          busy={false}
          error=""
          onCancel={() => setHiding(null)}
          onConfirm={() => {
            if (value.filter((v) => v.active).length === 1) onHideLast();
            change(hiding, { ...value[hiding], active: false });
            setHiding(null);
          }}
        >
          <p>
            {value.filter((v) => v.active).length === 1
              ? "Esta é a última opção disponível, o produto também será ocultado"
              : "A opção sairá do catálogo, você poderá mostrá-la novamente"}
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
