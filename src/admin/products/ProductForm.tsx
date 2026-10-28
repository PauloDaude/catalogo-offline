import { parseSale } from "../../catalog/validation";
import { ConfirmDialog } from "../ConfirmDialog";
import { SaleFields, type SaleDraft } from "./SaleFields";
import {
  VariantEditor,
  variantDraft,
  type VariantDraft,
} from "./VariantEditor";
import { useEffect, useState } from "react";
import { Form, TextField, Label, Input, Checkbox } from "react-aria-components";

import { Button } from "../../components/ui/button";
import type { AdminProduct, AdminCategory, ProductValues } from "../types";
import { AdminError, explainError } from "../api";
import { parseMoney, formatMoneyInput } from "./money";
import { useUnsaved } from "../unsaved";
import { PhotoPicker } from "./PhotoPicker";
import { SelectField } from "../SelectField";
import { optimizePhoto } from "./photo";

export function ProductForm({
  product,
  categories,
  onSave,
  onCancel,
  photoUrl,
}: {
  product: AdminProduct | null;
  categories: AdminCategory[];
  onSave: (values: ProductValues, photo?: Blob) => Promise<void>;
  onCancel: () => void;
  photoUrl: (path: string) => string;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(
    product?.category_id ?? categories.find((c) => c.active)?.id ?? "",
  );
  const [price, setPrice] = useState(
    product?.price_cents != null ? formatMoneyInput(product.price_cents) : "",
  );
  const [previous, setPrevious] = useState(
    product?.previous_price_cents
      ? formatMoneyInput(product.previous_price_cents)
      : "",
  );
  const [offer, setOffer] = useState(product?.previous_price_cents != null);
  const [hasVariants, setHasVariants] = useState(
    product?.has_variants || false,
  );
  const [attribute, setAttribute] = useState(product?.variant_attribute || "");
  const [rows, setRows] = useState<VariantDraft[]>(
    product?.variants?.length
      ? product.variants.map(variantDraft)
      : [variantDraft(), variantDraft()],
  );
  const [sale, setSale] = useState<SaleDraft>({
    sale_kind: product?.sale_kind || "unit",
    pack_count: product?.pack_count || 1,
    units_per_pack: product?.units_per_pack || 1,
  });
  const [active, setActive] = useState(product?.active ?? true);
  const [switchMode, setSwitchMode] = useState<boolean | null>(null);
  const [variantProcessing, setVariantProcessing] = useState(false);
  const [photo, setPhoto] = useState<Blob>();
  const [preview, setPreview] = useState("");
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [dirty, setDirty] = useState(false);
  const notifyDirty = useUnsaved();
  useEffect(() => {
    notifyDirty(dirty);
    return () => notifyDirty(false);
  }, [dirty, notifyDirty]);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const cancel = () => {
    if (
      !dirty ||
      window.confirm("Descartar as alterações que ainda não foram salvas?")
    )
      onCancel();
  };
  let discount = 0;
  try {
    const p = parseMoney(price),
      old = parseMoney(previous);
    if (old > p) discount = Math.floor(((old - p) * 100) / old);
  } catch {
    /* incomplete input */
  }

  return (
    <section className="admin-surface">
      <div className="admin-toolbar">
        <h1>
          {product ? `Editar produto #${product.code}` : "Adicionar produto"}
        </h1>
        <Button
          variant="outline"
          className="touch-button"
          onPress={cancel}
          isDisabled={busy || processing}
        >
          Cancelar
        </Button>
      </div>
      {switchMode !== null && (
        <ConfirmDialog
          isOpen
          title="Alterar tipo de produto?"
          confirmLabel="Alterar tipo"
          busy={false}
          error=""
          onCancel={() => setSwitchMode(null)}
          onConfirm={() => {
            setHasVariants(switchMode);
            setSwitchMode(null);
            setDirty(true);
          }}
        >
          <p>
            Seleções antigas precisarão ser revisadas quando o produto passar a
            exigir outra opção ou unidade de venda
          </p>
        </ConfirmDialog>
      )}
      {!active && <p className="admin-notice">O produto será salvo oculto</p>}
      <Form
        className="product-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || processing || variantProcessing || conflict) return;
          setError("");
          try {
            if (!navigator.onLine)
              throw new Error("Conecte-se à internet para salvar.");
            if (!name.trim() || !category)
              throw new Error("Informe o nome e escolha uma categoria.");
            const cents = hasVariants ? null : parseMoney(price),
              old = !hasVariants && offer ? parseMoney(previous) : null;
            if (hasVariants && !attribute.trim())
              throw new Error("Informe a característica das opções");
            const checkSale = (s: SaleDraft) =>
              parseSale({
                kind: s.sale_kind,
                packCount: s.pack_count,
                unitsPerPack: s.units_per_pack,
              });
            if (!hasVariants) checkSale(sale);
            const variants = hasVariants
              ? rows.map((r) => {
                  checkSale(r);
                  const current = parseMoney(r.price),
                    before = r.offer ? parseMoney(r.previous) : null;
                  if (!r.label.trim() || (before !== null && before <= current))
                    throw new Error(
                      "Confira o nome, preço e oferta das opções",
                    );
                  return {
                    id: r.id,
                    version: r.version,
                    label: r.label.trim(),
                    price_cents: current,
                    previous_price_cents: before,
                    image_path: r.image_path,
                    photo: r.photo,
                    active: r.active,
                    sale_kind: r.sale_kind,
                    pack_count: r.pack_count,
                    units_per_pack: r.units_per_pack,
                  };
                })
              : undefined;
            if (old !== null && cents !== null && old <= cents)
              throw new Error(
                "O preço anterior deve ser maior que o preço atual.",
              );
            if (!photo && (!product || removed))
              throw new Error("Escolha uma foto para o produto.");
            setBusy(true);
            await onSave(
              {
                name: name.trim(),
                category_id: category,
                price_cents: cents,
                previous_price_cents: old,
                image_path: product?.image_path ?? "",
                active,
                has_variants: hasVariants,
                variant_attribute: hasVariants ? attribute.trim() : null,
                sale_kind: hasVariants ? null : sale.sale_kind,
                pack_count: hasVariants ? null : sale.pack_count,
                units_per_pack: hasVariants ? null : sale.units_per_pack,
                variants,
              },
              photo,
            );
            setDirty(false);
          } catch (err) {
            setError(
              err instanceof AdminError
                ? explainError(err)
                : err instanceof Error
                  ? err.message
                  : explainError(err),
            );
            if (err instanceof AdminError && err.code === "conflict")
              setConflict(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <PhotoPicker
          image={
            preview ||
            (!removed && product ? photoUrl(product.image_path) : undefined)
          }
          isDisabled={busy || processing}
          isProcessing={processing}
          onSelect={async (file) => {
            setProcessing(true);
            setError("");
            try {
              setPhoto(await optimizePhoto(file));
              setRemoved(false);
              setDirty(true);
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Não foi possível abrir a imagem",
              );
            } finally {
              setProcessing(false);
            }
          }}
          onRemove={() => {
            setPhoto(undefined);
            setPreview("");
            setRemoved(true);
            setDirty(true);
          }}
        />
        <div className="product-form-fields">
          <TextField
            isDisabled={busy}
            isRequired
            maxLength={160}
            value={name}
            onChange={(v) => {
              setName(v);
              setDirty(true);
            }}
          >
            <Label>Nome do produto</Label>
            <Input />
          </TextField>
          <SelectField
            label="Categoria"
            value={category}
            onChange={(value) => {
              setCategory(value);
              setDirty(true);
            }}
            isDisabled={busy}
            isRequired
            options={categories
              .filter((c) => c.active || c.id === category)
              .map((c) => ({
                id: c.id,
                name: `${c.name}${c.active ? "" : " (arquivada)"}`,
              }))}
          />
          <SelectField
            label="Tipo de produto"
            value={hasVariants ? "variants" : "simple"}
            isDisabled={busy || variantProcessing}
            options={[
              { id: "simple", name: "Produto simples" },
              { id: "variants", name: "Produto com variantes" },
            ]}
            onChange={(v) => {
              const mode = v === "variants";
              if (product && mode !== hasVariants) setSwitchMode(mode);
              else {
                setHasVariants(mode);
                setDirty(true);
              }
            }}
          />
          {hasVariants ? (
            <>
              <TextField
                isRequired
                isDisabled={busy}
                value={attribute}
                onChange={(v) => {
                  setAttribute(v);
                  setDirty(true);
                }}
                maxLength={80}
              >
                <Label>Característica</Label>
                <Input placeholder="Tamanho, capacidade ou modelo" />
              </TextField>
              <VariantEditor
                value={rows}
                onChange={(v) => {
                  setRows(v);
                  setDirty(true);
                }}
                parentImage={
                  preview ||
                  (!removed && product
                    ? photoUrl(product.image_path)
                    : undefined)
                }
                photoUrl={photoUrl}
                disabled={busy || variantProcessing}
                onProcessing={setVariantProcessing}
                onHideLast={() => setActive(false)}
              />
            </>
          ) : (
            <>
              <SaleFields
                value={sale}
                onChange={(v) => {
                  setSale(v);
                  setDirty(true);
                }}
                disabled={busy}
              />
              <TextField
                isDisabled={busy}
                isRequired
                value={price}
                onChange={(v) => {
                  setPrice(v);
                  setDirty(true);
                }}
              >
                <Label>Preço atual (R$)</Label>
                <Input
                  inputMode="decimal"
                  placeholder="65,00"
                />
              </TextField>
              <Checkbox
                isDisabled={busy}
                isSelected={offer}
                onChange={(v) => {
                  setOffer(v);
                  setDirty(true);
                }}
                className="admin-checkbox"
              >
                <span
                  className="checkbox-mark"
                  aria-hidden="true"
                >
                  {offer ? "✓" : ""}
                </span>
                Produto em oferta
              </Checkbox>
              {offer && (
                <>
                  <TextField
                    isDisabled={busy}
                    isRequired
                    value={previous}
                    onChange={(v) => {
                      setPrevious(v);
                      setDirty(true);
                    }}
                  >
                    <Label>Preço anterior (R$)</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="100,00"
                    />
                  </TextField>
                  {discount > 0 && (
                    <p className="admin-discount">{discount}% de desconto</p>
                  )}
                </>
              )}
            </>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="admin-error"
          >
            {error}
          </p>
        )}
        {conflict && (
          <Button
            variant="outline"
            className="touch-button"
            onPress={() => {
              if (
                window.confirm(
                  "Descartar suas alterações e carregar a versão do servidor?",
                )
              )
                onCancel();
            }}
          >
            Recarregar dados
          </Button>
        )}
        <Button
          type="submit"
          className="touch-button"
          isDisabled={busy || processing || variantProcessing || conflict}
        >
          {busy ? "Salvando…" : "Salvar produto"}
        </Button>
      </Form>
    </section>
  );
}
