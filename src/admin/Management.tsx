import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Checkbox, TextField, Label, Input } from "react-aria-components";

import { Button } from "../components/ui/button";
import { price } from "../catalog/price";
import { createAdminApi, explainError } from "./api";
import type { AdminProduct } from "./types";
import { ProductForm } from "./products/ProductForm";
import { SelectField } from "./SelectField";
import { Check, Trash2 } from "lucide-react";
import { ProductBulkActions } from "./products/ProductBulkActions";
import {
  ProductActionDialog,
  type ProductAction,
} from "./products/ProductActionDialog";
import { ProductListViewport } from "./products/ProductListViewport";
import {
  toggleProduct,
  partitionSelection,
  togglePage,
  type ProductSelection,
  type ProductSelectionItem,
} from "./products/selection";
import { useManagementData } from "./useManagementData";
import { Categories } from "./categories/Categories";

export function Management({ client }: { client: SupabaseClient }) {
  const api = useMemo(() => createAdminApi(client), [client]);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [editing, setEditing] = useState<AdminProduct | null | undefined>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [busy, setBusy] = useState(false);
  const [selection, setSelection] = useState<ProductSelection>(new Map());
  const [action, setAction] = useState<ProductAction | null>(null);
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(1);
  const { data, initialized, refresh, error, setError, loading } =
    useManagementData(api, { page, query, category, visibility }, setPage);
  useEffect(() => {
    if (
      category &&
      initialized &&
      !data.categories.some((c) => c.id === category)
    ) {
      setCategory("");
      setPage(1);
    }
  }, [category, data.categories, initialized]);
  const products = data.products;
  const pages = Math.max(1, Math.ceil(data.total / 20));

  const clearSelection = () => setSelection(new Map());
  const openAction = (
    kind: ProductAction["kind"],
    targets: ProductAction["targets"],
  ) => {
    setActionError("");
    setAction({ kind, targets });
  };
  const executeAction = async (
    kind: "show" | "hide" | "delete",
    targets: ProductSelectionItem[],
  ) => {
    const { eligible } = partitionSelection(kind, targets);
    if (busy || !eligible.length) return;
    const report = (text: string) =>
      action ? setActionError(text) : setError(text);
    if (!navigator.onLine) {
      report("Conecte-se à internet para continuar");
      return;
    }
    setBusy(true);
    setError("");
    setActionError("");
    setMessage("");
    try {
      let updated = 0;
      if (kind === "delete") {
        if (eligible.length === 1) {
          await api.removeProduct(eligible[0].id, eligible[0].version);
          updated = 1;
        } else updated = (await api.removeProducts(eligible)).deleted;
      } else
        updated = (await api.setProductsVisibility(targets, kind === "show"))
          .updated;
      setAction(null);
      clearSelection();
      setMessage(
        kind === "delete"
          ? updated === 1
            ? "Produto excluído definitivamente"
            : `${updated} produtos excluídos definitivamente`
          : updated === 0
            ? "Os produtos já estavam no estado solicitado"
            : updated === 1
              ? kind === "hide"
                ? "Produto ocultado no servidor"
                : "Produto visível no catálogo"
              : `${updated} produtos ${kind === "hide" ? "ocultados no servidor" : "visíveis no catálogo"}`,
      );
      await refresh().catch(() =>
        setError(
          "A ação foi concluída, mas não foi possível atualizar a lista",
        ),
      );
    } catch (err) {
      report(explainError(err));
    } finally {
      setBusy(false);
    }
  };

  const feedback = (
    <>
      {message && (
        <p
          role="status"
          className="admin-notice"
        >
          {message}
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="admin-error"
        >
          {error}
          <Button
            variant="outline"
            className="touch-button"
            onPress={async () => {
              try {
                await refresh();
                setError("");
              } catch {
                setError("Não foi possível carregar, tente novamente");
              }
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </>
  );

  if (editing !== undefined)
    return (
      <ProductForm
        product={editing}
        categories={data.categories}
        photoUrl={api.photoUrl}
        onCancel={() => {
          setEditing(undefined);
          void refresh().catch(() =>
            setError("Não foi possível atualizar a lista."),
          );
        }}
        onSave={async (values, photo) => {
          await api.saveProduct(values, editing, photo);
          setEditing(undefined);
          setMessage(
            "Produto salvo no servidor, atualize a cópia offline para ver as mudanças neste aparelho",
          );
          if (editing === null && page !== 1) setPage(1);
          else
            await refresh().catch(() =>
              setError(
                "O produto foi salvo, mas não foi possível atualizar a lista",
              ),
            );
        }}
      />
    );

  return (
    <>
      {action && (
        <ProductActionDialog
          action={action}
          busy={busy}
          error={actionError}
          onCancel={() => setAction(null)}
          onConfirm={() => void executeAction(action.kind, action.targets)}
        />
      )}
      <nav
        className="admin-tabs"
        aria-label="Gerenciamento"
      >
        <Button
          className="touch-button"
          variant={tab === "products" ? "default" : "outline"}
          isDisabled={busy}
          onPress={() => {
            clearSelection();
            setTab("products");
          }}
        >
          Produtos
        </Button>
        <Button
          className="touch-button"
          variant={tab === "categories" ? "default" : "outline"}
          isDisabled={busy}
          onPress={() => {
            clearSelection();
            setTab("categories");
          }}
        >
          Categorias
        </Button>
      </nav>
      {tab === "categories" && feedback}
      {tab === "categories" ? (
        <Categories
          categories={data.categories}
          api={api}
          onChanged={refresh}
        />
      ) : (
        <section className="admin-surface admin-products-panel">
          <div className="admin-toolbar">
            <h1>Produtos</h1>
            <Button
              className="touch-button"
              isDisabled={busy}
              onPress={() => {
                clearSelection();
                setEditing(null);
                setMessage("");
              }}
            >
              Adicionar produto
            </Button>
          </div>
          <div className="admin-list-controls">
            {feedback}
            <div className="admin-filters">
              <TextField
                value={query}
                onChange={(value) => {
                  clearSelection();
                  setQuery(value);
                  setPage(1);
                }}
              >
                <Label>Pesquisar produtos</Label>
                <Input
                  type="search"
                  placeholder="Nome ou código"
                />
              </TextField>
              <SelectField
                label="Categoria"
                value={category || "all-categories"}
                onChange={(value) => {
                  clearSelection();
                  setCategory(value === "all-categories" ? "" : value);
                  setPage(1);
                }}
                options={[
                  { id: "all-categories", name: "Todas" },
                  ...data.categories.map((c) => ({ id: c.id, name: c.name })),
                ]}
              />
              <SelectField
                label="Mostrar"
                value={visibility}
                onChange={(value) => {
                  clearSelection();
                  setVisibility(value);
                  setPage(1);
                }}
                options={[
                  { id: "all", name: "Todos" },
                  { id: "active", name: "Visíveis" },
                  { id: "hidden", name: "Ocultos" },
                ]}
              />
            </div>
            <ProductBulkActions
              products={products}
              selection={selection}
              disabled={busy || loading}
              onTogglePage={() =>
                setSelection((previous) => togglePage(previous, products))
              }
              onClear={clearSelection}
              onShow={() => openAction("show", [...selection.values()])}
              onHide={() => openAction("hide", [...selection.values()])}
              onDelete={() => openAction("delete", [...selection.values()])}
            />
            {!loading && !error && (
              <p
                className="admin-list-count"
                role="status"
              >
                {data.total
                  ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, data.total)} de ${data.total} produtos`
                  : "0 produtos"}
              </p>
            )}
          </div>
          {loading ? (
            <p role="status">Carregando produtos…</p>
          ) : (
            !error && (
              <>
                <ProductListViewport
                  resetKey={JSON.stringify([page, query, category, visibility])}
                >
                  <ul className="admin-list">
                    {products.map((p) => (
                      <li
                        key={p.id}
                        className="admin-product-row"
                      >
                        <Checkbox
                          className="admin-selection-checkbox admin-row-checkbox"
                          aria-label={`Selecionar ${p.name}`}
                          isSelected={selection.has(p.id)}
                          isDisabled={busy}
                          onChange={() =>
                            setSelection((previous) =>
                              toggleProduct(previous, p),
                            )
                          }
                        >
                          <span
                            className="admin-selection-checkbox-box"
                            aria-hidden="true"
                          >
                            <Check />
                          </span>
                        </Checkbox>
                        <img
                          src={api.photoUrl(p.image_path)}
                          alt=""
                          loading="lazy"
                        />
                        <div className="admin-product-info">
                          <strong>{p.name}</strong>
                          <small>
                            #{p.code} ·{" "}
                            {
                              data.categories.find(
                                (c) => c.id === p.category_id,
                              )?.name
                            }
                          </small>
                          <span>
                            {p.has_variants
                              ? `${p.variants?.filter((v) => v.active).length || 0} opções`
                              : price(p.price_cents ?? 0)}
                            {p.previous_price_cents && (
                              <del>{price(p.previous_price_cents)}</del>
                            )}
                          </span>
                          {!p.active && <small>Oculto no catálogo</small>}
                        </div>
                        <div className="admin-actions">
                          <Button
                            variant="outline"
                            className="touch-button"
                            aria-label={`Editar ${p.name}`}
                            onPress={() => {
                              clearSelection();
                              setEditing(p);
                            }}
                            isDisabled={busy}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            className="touch-button"
                            aria-label={`${p.active ? "Ocultar" : "Mostrar novamente"} ${p.name}`}
                            isDisabled={busy}
                            onPress={() =>
                              p.active
                                ? openAction("hide", [p])
                                : void executeAction("show", [p])
                            }
                          >
                            {p.active ? "Ocultar" : "Mostrar novamente"}
                          </Button>
                          {!p.active && (
                            <Button
                              variant="destructive"
                              className="touch-button"
                              aria-label={`Excluir ${p.name}`}
                              isDisabled={busy}
                              onPress={() =>
                                openAction("delete", [
                                  {
                                    ...p,
                                    variantCount: p.variants?.length || 0,
                                  },
                                ])
                              }
                            >
                              <Trash2 aria-hidden="true" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </ProductListViewport>

                {!products.length && (
                  <p>
                    Use Adicionar produto para cadastrar seu primeiro item ou
                    ajuste os filtros para encontrar um produto
                  </p>
                )}
              </>
            )
          )}
          <nav
            className="admin-pagination"
            aria-label="Paginação dos produtos"
          >
            <Button
              variant="outline"
              className="touch-button"
              aria-disabled={page === 1 || busy || loading}
              onPress={() => {
                if (page > 1 && !busy && !loading) setPage(page - 1);
              }}
            >
              Anterior
            </Button>
            <span>
              Página {page} de {pages}
            </span>
            <Button
              variant="outline"
              className="touch-button"
              aria-disabled={page >= pages || busy || loading}
              onPress={() => {
                if (page < pages && !busy && !loading) setPage(page + 1);
              }}
            >
              Próxima
            </Button>
          </nav>
        </section>
      )}
    </>
  );
}
