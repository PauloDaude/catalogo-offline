import { Checkbox } from "react-aria-components";
import { Check, Minus } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  pageSelection,
  type ProductSelection,
  type ProductSelectionItem,
} from "./selection";
export function ProductBulkActions({
  products,
  selection,
  disabled,
  onTogglePage,
  onClear,
  onShow,
  onHide,
}: {
  products: ProductSelectionItem[];
  selection: ProductSelection;
  disabled: boolean;
  onTogglePage: () => void;
  onClear: () => void;
  onShow: () => void;
  onHide: () => void;
}) {
  const state = pageSelection(selection, products),
    count = selection.size;
  return (
    <div className="admin-bulk-actions">
      <Checkbox
        aria-label="Selecionar página"
        className="admin-selection-checkbox"
        isSelected={state === "all"}
        isIndeterminate={state === "partial"}
        isDisabled={disabled || !products.length}
        onChange={onTogglePage}
      >
        <span
          className="admin-selection-checkbox-box"
          aria-hidden="true"
        >
          {state === "partial" ? <Minus /> : <Check />}
        </span>
        <span>Selecionar página</span>
      </Checkbox>
      {count > 0 && (
        <>
          <strong role="status">
            {count} {count === 1 ? "selecionado" : "selecionados"}
          </strong>
          <div className="admin-bulk-buttons">
            <Button
              variant="outline"
              className="touch-button"
              aria-label="Mostrar selecionados"
              isDisabled={disabled}
              onPress={onShow}
            >
              Mostrar
            </Button>
            <Button
              variant="outline"
              className="touch-button"
              aria-label="Ocultar selecionados"
              isDisabled={disabled}
              onPress={onHide}
            >
              Ocultar
            </Button>
            <Button
              variant="ghost"
              className="touch-button"
              isDisabled={disabled}
              onPress={onClear}
            >
              Limpar seleção
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
