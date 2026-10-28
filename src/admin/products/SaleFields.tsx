import { TextField, Label, Input } from "react-aria-components";
import { SelectField } from "../SelectField";
export type SaleDraft = {
  sale_kind: "unit" | "box";
  pack_count: number;
  units_per_pack: number;
};
export const defaultSale: SaleDraft = {
  sale_kind: "unit",
  pack_count: 1,
  units_per_pack: 1,
};
export function SaleFields({
  value,
  onChange,
  disabled = false,
  suffix = "",
}: {
  value: SaleDraft;
  onChange: (value: SaleDraft) => void;
  disabled?: boolean;
  suffix?: string;
}) {
  return (
    <div className="sale-fields">
      <SelectField
        label={`Unidade de venda${suffix}`}
        value={value.sale_kind}
        isDisabled={disabled}
        onChange={(kind) =>
          onChange(
            kind === "unit" ? defaultSale : { ...value, sale_kind: "box" },
          )
        }
        options={[
          { id: "unit", name: "Unidade" },
          { id: "box", name: "Caixa / pacote" },
        ]}
      />
      {value.sale_kind === "box" && (
        <>
          <TextField
            isRequired
            isDisabled={disabled}
            value={String(value.pack_count || "")}
            onChange={(v) => onChange({ ...value, pack_count: Number(v) })}
          >
            <Label>Quantidade de conjuntos{suffix}</Label>
            <Input inputMode="numeric" />
          </TextField>
          <TextField
            isRequired
            isDisabled={disabled}
            value={String(value.units_per_pack || "")}
            onChange={(v) => onChange({ ...value, units_per_pack: Number(v) })}
          >
            <Label>Unidades por conjunto{suffix}</Label>
            <Input inputMode="numeric" />
          </TextField>
          <p>
            O preço informado é da caixa completa (
            {value.pack_count * value.units_per_pack} unidades)
          </p>
        </>
      )}
    </div>
  );
}
