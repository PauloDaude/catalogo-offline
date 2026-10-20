import { useEffect, useState } from "react";
import { Form, TextField, Label, Input, Checkbox } from "react-aria-components";

import { Button } from "../../components/ui/button";
import type { AdminProduct, AdminCategory, ProductValues } from "../types";
import { AdminError, explainError } from "../api";
import { parseMoney, formatMoneyInput } from "./money";
import { useUnsaved } from "../unsaved";
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
    product ? formatMoneyInput(product.price_cents) : "",
  );
  const [previous, setPrevious] = useState(
    product?.previous_price_cents
      ? formatMoneyInput(product.previous_price_cents)
      : "",
  );
  const [offer, setOffer] = useState(product?.previous_price_cents != null);
  const [photo, setPhoto] = useState<Blob>();
  const [preview, setPreview] = useState("");
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
      <Form
        className="product-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || processing || conflict) return;
          setError("");
          try {
            if (!navigator.onLine)
              throw new Error("Conecte-se à internet para salvar.");
            if (!name.trim() || !category)
              throw new Error("Informe o nome e escolha uma categoria.");
            const cents = parseMoney(price),
              old = offer ? parseMoney(previous) : null;
            if (old !== null && old <= cents)
              throw new Error(
                "O preço anterior deve ser maior que o preço atual.",
              );
            if (!product && !photo)
              throw new Error("Escolha uma foto para o produto.");
            setBusy(true);
            await onSave(
              {
                name: name.trim(),
                category_id: category,
                price_cents: cents,
                previous_price_cents: old,
                image_path: product?.image_path ?? "",
                active: product?.active ?? true,
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
        <div className="photo-field">
          {(preview || product) && (
            <img
              className="admin-photo-preview"
              src={preview || photoUrl(product!.image_path)}
              alt="Prévia da foto do produto"
            />
          )}
          <label htmlFor="product-photo">
            {product ? "Trocar foto" : "Foto do produto"}
          </label>
          <input
            id="product-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy || processing}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setProcessing(true);
              setError("");
              try {
                setPhoto(await optimizePhoto(file));
                setDirty(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Foto inválida.");
              } finally {
                setProcessing(false);
                e.target.value = "";
              }
            }}
          />
          <small>
            Escolha da galeria ou tire uma foto. Ela será preparada para o
            catálogo.
          </small>
          {processing && <p role="status">Preparando foto…</p>}
        </div>
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
          <label className="admin-field">
            Categoria
            <select
              disabled={busy}
              required
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setDirty(true);
              }}
            >
              <option value="">Escolha uma categoria</option>
              {categories
                .filter((c) => c.active || c.id === category)
                .map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                    {!c.active ? " (arquivada)" : ""}
                  </option>
                ))}
            </select>
          </label>
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
          isDisabled={busy || processing || conflict}
        >
          {busy ? "Salvando…" : "Salvar produto"}
        </Button>
      </Form>
    </section>
  );
}
