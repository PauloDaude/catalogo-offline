import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TextField, Label, Input } from "react-aria-components";

import { Button } from "../components/ui/button";
import { price } from "../catalog/price";
import { createAdminApi, explainError } from "./api";
import type { AdminCategory, AdminProduct } from "./types";
import { ProductForm } from "./products/ProductForm";
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
  const [visibility, setVisibility] = useState("active");
  const [busy, setBusy] = useState(false);
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
            "Não foi possível carregar. Confira sua conexão ou a configuração do banco.",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [api]);
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
            "Produto salvo no servidor. Atualize a cópia offline para ver as mudanças neste aparelho.",
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
                setError("Não foi possível carregar. Tente novamente.");
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
            <label className="admin-field">
              Categoria
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Todas</option>
                {data.categories.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              Mostrar
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="active">Visíveis</option>
                <option value="hidden">Ocultos</option>
                <option value="all">Todos</option>
              </select>
            </label>
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
              Nenhum produto encontrado. Use Adicionar produto para começar.
            </p>
          )}
        </section>
      )}
    </>
  );
}
