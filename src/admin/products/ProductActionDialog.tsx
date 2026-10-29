import { ConfirmDialog } from "../ConfirmDialog";
import { partitionSelection, type ProductSelectionItem } from "./selection";
export type ProductAction = {
  kind: "show" | "hide" | "delete";
  targets: Array<ProductSelectionItem & { variantCount?: number }>;
};
export function ProductActionDialog({
  action,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  action: ProductAction;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { eligible, skipped } = partitionSelection(action.kind, action.targets);
  const deleting = action.kind === "delete",
    showing = action.kind === "show",
    count = eligible.length;
  const verb = showing ? "Mostrar" : "Ocultar";
  const visibilityLabel =
    count === 1
      ? `${verb} produto`
      : `${verb} ${count || ""} produtos`.replace("  ", " ");
  const title = deleting
    ? count > 1
      ? `Excluir ${count} produtos definitivamente?`
      : "Excluir produto definitivamente?"
    : `${visibilityLabel}?`;
  const confirmLabel = deleting
    ? count > 1
      ? `Excluir ${count} produtos definitivamente`
      : "Excluir definitivamente"
    : visibilityLabel;
  const eligibleLabel = deleting
    ? "Serão excluídos"
    : showing
      ? "Serão mostrados"
      : "Serão ocultados";
  const skippedLabel = deleting
    ? "Precisam ser ocultados antes de excluir"
    : showing
      ? "Já estão visíveis, não serão alterados"
      : "Já estão ocultos, não serão alterados";
  const list = (items: ProductSelectionItem[]) => (
    <ul className="admin-action-targets">
      {items.map((p) => (
        <li key={p.id}>
          <strong>{p.name}</strong> <span>#{p.code}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <ConfirmDialog
      isOpen
      title={title}
      confirmLabel={confirmLabel}
      busy={busy}
      error={error}
      isConfirmDisabled={!count}
      confirmVariant={showing ? "default" : "destructive"}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>
        {deleting
          ? "Apenas os produtos ocultos serão excluídos definitivamente, incluindo suas variantes"
          : "Confira os produtos selecionados, incluindo os de outras páginas"}
      </p>
      {count > 0 ? (
        <section
          role="region"
          aria-label={eligibleLabel}
        >
          <h3>
            {eligibleLabel} ({count})
          </h3>
          {list(eligible)}
        </section>
      ) : (
        <p role="status">
          {deleting
            ? "Nenhum produto oculto foi selecionado"
            : "Nenhum produto precisa desta alteração"}
        </p>
      )}
      {skipped.length > 0 && (
        <section
          role="region"
          aria-label={skippedLabel}
        >
          <h3>
            {skippedLabel} ({skipped.length})
          </h3>
          {list(skipped)}
        </section>
      )}
      {count > 0 && (
        <p>
          {deleting
            ? "Não será possível desfazer pelo painel"
            : "Você poderá alterar a visibilidade novamente quando quiser"}
        </p>
      )}
    </ConfirmDialog>
  );
}
