import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect } from "vitest";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select";
import { Label } from "react-aria-components";
test("select oferece lista acessível por teclado", async () => {
  render(
    <Select defaultValue="all">
      <Label>Mostrar</Label>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem id="all">Todos</SelectItem>
        <SelectItem id="hidden">Ocultos</SelectItem>
      </SelectContent>
    </Select>,
  );
  const user = userEvent.setup();
  screen.getByRole("button", { name: /Mostrar/ }).focus();
  await user.keyboard(" ");
  expect(screen.getByRole("listbox")).toBeVisible();
  await user.keyboard("{End}{Enter}");
  expect(screen.getByRole("button", { name: /Mostrar/ })).toHaveTextContent(
    "Ocultos",
  );
});
