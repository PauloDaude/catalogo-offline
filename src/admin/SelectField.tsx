import { Label } from "react-aria-components";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";

export function SelectField({
  label,
  value,
  onChange,
  options,
  isDisabled = false,
  isRequired = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
  isDisabled?: boolean;
  isRequired?: boolean;
}) {
  return (
    <Select
      placeholder="Selecione uma opção"
      className="admin-select"
      value={value}
      onChange={(key) => onChange(String(key ?? ""))}
      isDisabled={isDisabled}
      isRequired={isRequired}
    >
      <Label>{label}</Label>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem
            key={item.id}
            id={item.id}
          >
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
