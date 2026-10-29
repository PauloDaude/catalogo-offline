import type { ReactNode } from "react";
import { Dialog, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export function ConfirmDialog({
  isOpen,
  title,
  children,
  confirmLabel,
  busy = false,
  isConfirmDisabled = false,
  confirmVariant = "destructive",
  error,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  isConfirmDisabled?: boolean;
  confirmVariant?: "default" | "destructive";
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}
      isDismissable={!busy}
      isKeyboardDismissDisabled={busy}
      showCloseButton={false}
      className="admin-dialog"
    >
      <DialogTitle>{title}</DialogTitle>
      <div className="admin-dialog-body">{children}</div>
      {error && (
        <p
          role="alert"
          className="admin-error"
        >
          {error}
        </p>
      )}
      <div className="admin-dialog-actions">
        <Button
          variant="outline"
          className="touch-button"
          onPress={onCancel}
          isDisabled={busy}
        >
          Cancelar
        </Button>
        <Button
          variant={confirmVariant}
          className="touch-button"
          onPress={onConfirm}
          isDisabled={busy || isConfirmDisabled}
        >
          {busy ? "Aguarde…" : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
