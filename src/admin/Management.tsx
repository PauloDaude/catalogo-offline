import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TextField, Label, Input } from "react-aria-components";

import { Button } from "../components/ui/button";
import { price } from "../catalog/price";
import { createAdminApi, explainError } from "./api";
import type { AdminCategory, AdminProduct } from "./types";
import { ProductForm } from "./products/ProductForm";
import { SelectField } from "./SelectField";
import { ConfirmDialog } from "./ConfirmDialog";
import { Categories } from "./categories/Categories";

export function Management({ client }: { client: SupabaseClient }) {
  const api = useMemo(() => createAdminApi(client), [client]);
  const [data, setData] = useState<{
    products: AdminProduct[];
    categories: AdminCategory[];
  }>({ products: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [editing, setEditing] = useState<AdminProduct | null | undefined>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [busy, setBusy] = useState(false);
  const [hideTarget, setHideTarget] = useState<AdminProduct | null>(null);
  const [hideError, setHideError] = useState("");
  const refresh = useCallback(async () => {
    const result = await api.list();
    setData(result);
  }, [api]);
  useEffect(() => {
    let alive = true;
    void api
      .list()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch(() => {
        if (alive)
          setError(
            "Não foi possível carregar, confira sua conexão ou a configuração do banco",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [api]);
  useEffect(() => {
    if (category && !data.categories.some((c) => c.id === category))
      setCategory("");
  }, [category, data.categories]);
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const products = data.products.filter(
    (p) =>
      (!category || p.category_id === category) &&
      (visibility === "all" || p.active === (visibility === "active")) &&
      normalize(`${p.name} ${p.code}`).includes(normalize(query)),
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
          await refresh().catch(() =>
            setError(
              "O produto foi salvo, mas não foi possível atualizar a lista.",
            ),
          );
        }}
      />
    );

  return (
    <>
      {hideTarget && (
        <ConfirmDialog
          isOpen
          title="Ocultar produto?"
          confirmLabel="Ocultar produto"
          busy={busy}
          error={hideError}
          onCancel={() => setHideTarget(null)}
          onConfirm={async () => {
            if (busy) return;
            if (!navigator.onLine) {
              setHideError("Conecte-se à internet para ocultar o produto");
              return;
            }
            setBusy(true);
            setHideError("");
            try {
              await api.saveProduct(
                { ...hideTarget, active: false },
                hideTarget,
              );
              setHideTarget(null);
              setMessage("Produto ocultado no servidor");
              await refresh().catch(() =>
                setError(
                  "O produto foi ocultado, mas não foi possível atualizar a lista",
                ),
              );
            } catch (err) {
              setHideError(explainError(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            Ocultar <strong>{hideTarget.name}</strong> do catálogo?
          </p>
          <p>Você poderá mostrar o produto novamente quando quiser</p>
        </ConfirmDialog>
      )}
      <nav
        className="admin-tabs"
        aria-label="Gerenciamento"
      >
        <Button
          className="touch-button"
          variant={tab === "products" ? "default" : "outline"}
          onPress={() => setTab("products")}
        >
          Produtos
        </Button>
        <Button
          className="touch-button"
          variant={tab === "categories" ? "default" : "outline"}
          onPress={() => setTab("categories")}
        >
          Categorias
        </Button>
      </nav>
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
      {loading ? (
        <p role="status">Carregando produtos…</p>
      ) : tab === "categories" ? (
        <Categories
          {...data}
          api={api}
          onChanged={refresh}
        />
      ) : (
        <section className="admin-surface">
          <div className="admin-toolbar">
            <h1>Produtos</h1>
            <Button
              className="touch-button"
              onPress={() => {
                setEditing(null);
                setMessage("");
              }}
            >
              Adicionar produto
            </Button>
          </div>
          <div className="admin-filters">
            <TextField
              value={query}
              onChange={setQuery}
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
              onChange={(value) =>
                setCategory(value === "all-categories" ? "" : value)
              }
              options={[
                { id: "all-categories", name: "Todas" },
                ...data.categories.map((c) => ({ id: c.id, name: c.name })),
              ]}
            />
            <SelectField
              label="Mostrar"
              value={visibility}
              onChange={setVisibility}
              options={[
                { id: "all", name: "Todos" },
                { id: "active", name: "Visíveis" },
                { id: "hidden", name: "Ocultos" },
              ]}
            />
          </div>
          <p>{products.length} produtos</p>
          <ul className="admin-list">
            {products.map((p) => (
              <li
                key={p.id}
                className="admin-product-row"
              >
                <img
                  src={api.photoUrl(p.image_path)}
                  alt=""
                  loading="lazy"
                />
                <div className="admin-product-info">
                  <strong>{p.name}</strong>
                  <small>
                    #{p.code} ·{" "}
                    {data.categories.find((c) => c.id === p.category_id)?.name}
                  </small>
                  <span>
                    {price(p.price_cents)}
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
                    onPress={() => setEditing(p)}
                    isDisabled={busy}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="touch-button"
                    aria-label={`${p.active ? "Ocultar" : "Mostrar novamente"} ${p.name}`}
                    isDisabled={busy}
                    onPress={async () => {
                      if (p.active) {
                        setHideError("");
                        setHideTarget(p);
                        return;
                      }
                      if (!navigator.onLine) {
                        setError(
                          "Conecte-se à internet para alterar produtos.",
                        );
                        return;
                      }
                      if (
                        !p.active &&
                        !data.categories.find((c) => c.id === p.category_id)
                          ?.active
                      ) {
                        setError(
                          "Reative a categoria ou edite o produto para escolher uma categoria ativa antes de mostrar novamente.",
                        );
                        return;
                      }
                      setBusy(true);
                      setError("");
                      try {
                        await api.saveProduct({ ...p, active: !p.active }, p);
                        await refresh();
                        setMessage(
                          p.active
                            ? "Produto ocultado no servidor."
                            : "Produto visível no catálogo.",
                        );
                      } catch (err) {
                        setError(explainError(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {p.active ? "Ocultar" : "Mostrar novamente"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {!products.length && (
            <p>
              Use Adicionar produto para cadastrar seu primeiro item ou ajuste
              os filtros para encontrar um produto
            </p>
          )}
        </section>
      )}
    </>
  );
}
