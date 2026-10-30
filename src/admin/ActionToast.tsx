import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { Button } from "../components/ui/button";

export function ActionToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (hovered || focused) return;
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [message, onClose, hovered, focused]);

  return createPortal(
    <div
      className="admin-action-toast"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <Check aria-hidden="true" />
      <p role="status">{message}</p>
      <Button
        variant="ghost"
        className="admin-toast-close"
        aria-label="Fechar notificação"
        onPress={onClose}
      >
        <X aria-hidden="true" />
      </Button>
    </div>,
    document.body,
  );
}
