import { ConfirmDialog } from "../ConfirmDialog";
import type { ProductSelectionItem } from "./selection";
export type ProductAction = {
  kind: "hide" | "delete";
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
  const deleting = action.kind === "delete",
    count = action.targets.length;
  const hideLabel =
    count === 1 ? "Ocultar produto" : `Ocultar ${count} produtos`;
  return (
    <ConfirmDialog
      isOpen
      title={deleting ? "Excluir produto definitivamente?" : `${hideLabel}?`}
      confirmLabel={deleting ? "Excluir definitivamente" : hideLabel}
      busy={busy}
      error={error}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>
        {deleting
          ? "Esta ação remove definitivamente o produto e suas variantes"
          : "Os produtos abaixo serão ocultados, incluindo os selecionados em outras páginas"}
      </p>
      <ul className="admin-action-targets">
        {action.targets.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong> <span>#{p.code}</span>
            {deleting && !!p.variantCount && (
              <small> · {p.variantCount} opções</small>
            )}
          </li>
        ))}
      </ul>
      <p>
        {deleting
          ? "Não será possível desfazer pelo painel"
          : "Você poderá mostrar os produtos novamente quando quiser"}
      </p>
    </ConfirmDialog>
  );
}
