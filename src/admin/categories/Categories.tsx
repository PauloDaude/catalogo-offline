import { useState } from "react";
import { Form, TextField, Label, Input } from "react-aria-components";
import { Plus, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Dialog, DialogTitle } from "../../components/ui/dialog";
import { ConfirmDialog } from "../ConfirmDialog";
import { explainError, type AdminApi } from "../api";
import type { AdminCategory, AdminProduct } from "../types";

type Editor = { id?: string; name: string };
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
  const [editor, setEditor] = useState<Editor | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [blocking, setBlocking] = useState<AdminProduct[]>([]);
  const [removing, setRemoving] = useState<AdminCategory | null>(null);
  const linked = removing
    ? products.filter((p) => p.category_id === removing.id)
    : [];
  const openEditor = (category?: AdminCategory) => {
    setBlocking([]);
    setError("");
    setName(category?.name ?? "");
    setEditor({ id: category?.id, name: category?.name ?? "" });
    setDialogError("");
  };
  const refresh = async (success: string) => {
    setMessage(success);
    try {
      await onChanged();
    } catch {
      setError(`${success}, mas não foi possível atualizar a lista`);
    }
  };

  return (
    <section className="admin-surface">
      <div className="admin-toolbar">
        <div>
          <h1>Categorias</h1>
          <p>Organize seus produtos e arquive categorias que não usa mais</p>
        </div>
        <Button
          className="touch-button"
          isDisabled={busy}
          onPress={() => openEditor()}
        >
          <Plus aria-hidden="true" />
          Criar categoria
        </Button>
      </div>
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
        <div
          role="alert"
          className="admin-error"
        >
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
              {!c.active && <small className="admin-archived">Arquivada</small>}
            </span>
            <div className="admin-actions">
              <Button
                variant="outline"
                className="touch-button"
                aria-label={`Renomear ${c.name}`}
                isDisabled={busy}
                onPress={() => openEditor(c)}
              >
                <Pencil aria-hidden="true" />
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
                    setError("Conecte-se à internet para continuar");
                    return;
                  }
                  setBusy(true);
                  try {
                    await api.setCategoryActive(c.id, !c.active);
                    await refresh(
                      c.active ? "Categoria arquivada" : "Categoria reativada",
                    );
                  } catch (err) {
                    setError(explainError(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {c.active ? (
                  <Archive aria-hidden="true" />
                ) : (
                  <ArchiveRestore aria-hidden="true" />
                )}
                {c.active ? "Arquivar" : "Reativar"}
              </Button>
              {!c.active && (
                <Button
                  variant="destructive"
                  className="touch-button"
                  aria-label={`Remover ${c.name}`}
                  isDisabled={busy}
                  onPress={() => {
                    setRemoving(c);
                    setDialogError("");
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  Remover
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!categories.length && (
        <p>Crie sua primeira categoria para organizar os produtos</p>
      )}
      <Dialog
        isOpen={editor !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setEditor(null);
        }}
        isDismissable={!busy}
        isKeyboardDismissDisabled={busy}
        showCloseButton={false}
        className="admin-dialog"
      >
        <DialogTitle>
          {editor?.id ? "Renomear categoria" : "Criar categoria"}
        </DialogTitle>
        <Form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || !editor) return;
            setDialogError("");
            if (!name.trim()) {
              setDialogError("Informe o nome da categoria");
              return;
            }
            if (!navigator.onLine) {
              setDialogError("Conecte-se à internet para salvar");
              return;
            }
            setBusy(true);
            setError("");
            try {
              await api.saveCategory(name, editor.id);
              setEditor(null);
              await refresh("Categoria salva no servidor");
            } catch (err) {
              setDialogError(explainError(err));
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
            isDisabled={busy}
          >
            <Label>Nome da categoria</Label>
            <Input autoFocus />
          </TextField>
          {dialogError && (
            <p
              role="alert"
              className="admin-error"
            >
              {dialogError}
            </p>
          )}
          <div className="admin-dialog-actions">
            <Button
              variant="outline"
              className="touch-button"
              isDisabled={busy}
              onPress={() => setEditor(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="touch-button"
              isDisabled={busy}
            >
              {busy
                ? "Salvando…"
                : editor?.id
                  ? "Salvar nome"
                  : "Criar categoria"}
            </Button>
          </div>
        </Form>
      </Dialog>
      {removing &&
        (linked.length ? (
          <Dialog
            isOpen
            onOpenChange={(open) => {
              if (!open) setRemoving(null);
            }}
            showCloseButton={false}
            className="admin-dialog"
          >
            <DialogTitle>Categoria com produtos vinculados</DialogTitle>
            <p>
              Mova estes produtos para outra categoria antes de remover{" "}
              <strong>{removing.name}</strong>
            </p>
            <ul className="category-linked-products">
              {linked.map((p) => (
                <li key={p.id}>
                  {p.name}
                  {!p.active ? " (oculto)" : ""}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="touch-button"
              onPress={() => setRemoving(null)}
            >
              Entendi
            </Button>
          </Dialog>
        ) : (
          <ConfirmDialog
            isOpen
            title="Remover categoria?"
            confirmLabel="Remover categoria"
            busy={busy}
            error={dialogError}
            onCancel={() => setRemoving(null)}
            onConfirm={async () => {
              if (busy) return;
              if (!navigator.onLine) {
                setDialogError(
                  "Conecte-se à internet para remover a categoria",
                );
                return;
              }
              setBusy(true);
              setError("");
              setDialogError("");
              try {
                await api.removeCategory(removing.id);
                setRemoving(null);
                await refresh("Categoria removida");
              } catch (err) {
                setDialogError(explainError(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            <p>
              Remover definitivamente a categoria{" "}
              <strong>{removing.name}</strong>?
            </p>
            <p>Essa ação não pode ser desfeita</p>
          </ConfirmDialog>
        ))}
    </section>
  );
}
