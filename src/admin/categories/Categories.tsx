import { useState } from "react";
import { Form, TextField, Label, Input } from "react-aria-components";

import { Button } from "../../components/ui/button";
import { explainError, type AdminApi } from "../api";
import type { AdminCategory, AdminProduct } from "../types";

export function Categories({
  categories,
  products,
  api,
  onChanged,
}: {
  categories: AdminCategory[];
  products: AdminProduct[];
  api: AdminApi;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [blocking, setBlocking] = useState<AdminProduct[]>([]);

  return (
    <section className="admin-surface">
      <h1>Categorias</h1>
      <p>
        Organize os produtos. Arquivar mantém os vínculos dos produtos ocultos.
      </p>
      <Form
        className="category-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setError("");
          setMessage("");
          if (!navigator.onLine) {
            setError("Conecte-se à internet para salvar.");
            return;
          }
          setBusy(true);
          try {
            await api.saveCategory(name, editing);
            setName("");
            setEditing(undefined);
            await onChanged();
            setMessage("Categoria salva no servidor.");
          } catch (err) {
            setError(explainError(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <TextField
          isRequired
          maxLength={80}
          value={name}
          onChange={setName}
        >
          <Label>
            {editing ? "Novo nome da categoria" : "Nome da categoria"}
          </Label>
          <Input />
        </TextField>
        <Button
          type="submit"
          className="touch-button"
          isDisabled={busy}
        >
          {editing ? "Salvar nome" : "Criar categoria"}
        </Button>
        {editing && (
          <Button
            variant="outline"
            className="touch-button"
            onPress={() => {
              setEditing(undefined);
              setName("");
            }}
          >
            Cancelar
          </Button>
        )}
      </Form>
      {message && <p role="status">{message}</p>}
      {error && (
        <p
          role="alert"
          className="admin-error"
        >
          {error}
        </p>
      )}
      {blocking.length > 0 && (
        <div role="alert">
          <p>Mova ou oculte estes produtos antes de arquivar:</p>
          <ul>
            {blocking.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
      )}
      <ul className="admin-list">
        {categories.map((c) => (
          <li
            key={c.id}
            className="admin-category-row"
          >
            <span>
              <strong>{c.name}</strong>
              {!c.active && <small>Arquivada</small>}
            </span>
            <div className="admin-actions">
              <Button
                variant="outline"
                className="touch-button"
                aria-label={`Renomear ${c.name}`}
                isDisabled={busy}
                onPress={() => {
                  setEditing(c.id);
                  setName(c.name);
                  setMessage("");
                }}
              >
                Renomear
              </Button>
              <Button
                variant="outline"
                className="touch-button"
                aria-label={`${c.active ? "Arquivar" : "Reativar"} ${c.name}`}
                isDisabled={busy}
                onPress={async () => {
                  setError("");
                  setMessage("");
                  const active = products.filter(
                    (p) => p.category_id === c.id && p.active,
                  );
                  setBlocking(c.active ? active : []);
                  if (c.active && active.length) return;
                  if (!navigator.onLine) {
                    setError("Conecte-se à internet para continuar.");
                    return;
                  }
                  setBusy(true);
                  try {
                    await api.setCategoryActive(c.id, !c.active);
                    await onChanged();
                    setMessage(
                      c.active
                        ? "Categoria arquivada."
                        : "Categoria reativada.",
                    );
                  } catch (err) {
                    setError(explainError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {c.active ? "Arquivar" : "Reativar"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
