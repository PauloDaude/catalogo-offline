import { Label } from "react-aria-components";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";

export function CategoryFilter({
  categories,
  value,
  onChange,
  isDisabled = false,
}: {
  categories: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  isDisabled?: boolean;
}) {
  return (
    <nav
      aria-label="Categorias"
      className="category-filter"
    >
      <Select
        className="category-select"
        value={value === null ? "all" : `category:${value}`}
        onChange={(key) =>
          onChange(key === "all" ? null : String(key).slice("category:".length))
        }
        isDisabled={isDisabled}
      >
        <Label className="sr-only">Categoria</Label>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className="category-filter-popover"
          placement="bottom start"
        >
          <SelectItem id="all">Todas as categorias</SelectItem>
          {categories.map((name) => (
            <SelectItem
              key={name}
              id={`category:${name}`}
            >
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </nav>
  );
}
