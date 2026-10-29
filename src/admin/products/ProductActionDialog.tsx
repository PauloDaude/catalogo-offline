import { useState } from "react";
import { Checkbox } from "react-aria-components";
import { Check, TriangleAlert } from "lucide-react";
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
  onConfirm: (hideVisible: boolean) => void;
  onCancel: () => void;
}) {
  const [hideVisible, setHideVisible] = useState(false);
  const { eligible, skipped } = partitionSelection(
    action.kind,
    action.targets,
    hideVisible,
  );
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
    ? hideVisible
      ? `Ocultar e excluir ${count === 1 ? "produto" : `${count} produtos`}`
      : count > 1
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
  const skippedHeading = deleting
    ? "Fora desta exclusão"
    : showing
      ? "Já estão visíveis"
      : "Já estão ocultos";
  const list = (items: ProductSelectionItem[]) => (
    <ul className="admin-action-targets">
      {items.map((p) => (
        <li key={p.id}>
          <strong>{p.name}</strong>{" "}
          <span className="admin-action-code">#{p.code}</span>
          {deleting && hideVisible && p.active && (
            <small className="admin-action-item-note">
              Será ocultado antes da exclusão
            </small>
          )}
        </li>
      ))}
    </ul>
  );
  return (
    <ConfirmDialog
      isOpen
      title={title}
      className="admin-product-action-dialog"
      confirmLabel={confirmLabel}
      busy={busy}
      error={error}
      isConfirmDisabled={!count}
      confirmVariant={showing ? "default" : "destructive"}
      onConfirm={() => onConfirm(hideVisible)}
      onCancel={onCancel}
    >
      <p className="admin-action-intro">
        {deleting
          ? hideVisible
            ? "Os produtos selecionados serão excluídos definitivamente, incluindo suas variantes"
            : "Apenas os produtos ocultos serão excluídos definitivamente, incluindo suas variantes"
          : "Confira os produtos selecionados, incluindo os de outras páginas"}
      </p>
      {deleting && action.targets.some((p) => p.active) && (
        <Checkbox
          className="admin-selection-checkbox admin-action-option"
          isSelected={hideVisible}
          isDisabled={busy}
          onChange={setHideVisible}
        >
          <span
            className="admin-selection-checkbox-box"
            aria-hidden="true"
          >
            <Check />
          </span>
          <span>Ocultar e excluir também os produtos visíveis</span>
        </Checkbox>
      )}
      {count > 0 ? (
        <section
          role="region"
          className="admin-action-group"
          data-destructive={deleting || undefined}
          aria-label={eligibleLabel}
        >
          <h3>
            <span>{eligibleLabel}</span>
            <span className="admin-action-count">{count}</span>
          </h3>
          {list(eligible)}
        </section>
      ) : (
        <p
          role="status"
          className="admin-action-empty"
        >
          {deleting
            ? "Nenhum produto oculto foi selecionado"
            : "Nenhum produto precisa desta alteração"}
        </p>
      )}
      {skipped.length > 0 && (
        <section
          role="region"
          className="admin-action-group admin-action-group-muted"
          aria-label={skippedLabel}
        >
          <h3>
            <span>{skippedHeading}</span>
            <span className="admin-action-count">{skipped.length}</span>
          </h3>
          {deleting && (
            <p className="admin-action-group-note">
              Estão visíveis no catálogo
            </p>
          )}
          {list(skipped)}
        </section>
      )}
      {count > 0 && (
        <p
          className={
            deleting ? "admin-action-warning" : "admin-action-footnote"
          }
        >
          {deleting && <TriangleAlert aria-hidden="true" />}
          <span>
            {deleting
              ? "Exclusão definitiva, sem opção de desfazer"
              : "Você poderá alterar a visibilidade novamente quando quiser"}
          </span>
        </p>
      )}
    </ConfirmDialog>
  );
}
