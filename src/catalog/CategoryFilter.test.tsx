import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { CategoryFilter } from "./CategoryFilter";

test("seletor tem Todas por padrão e oferece categorias por seleção única", async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <CategoryFilter
      categories={["Lazer", "Casa e cozinha"]}
      value={null}
      onChange={onChange}
    />,
  );
  const trigger = screen.getByRole("button", { name: /Categoria$/ });
  expect(trigger).toHaveTextContent("Todas as categorias");
  expect(screen.queryByRole("option")).not.toBeInTheDocument();
  await user.click(trigger);
  await user.click(screen.getByRole("option", { name: "Lazer" }));
  expect(onChange).toHaveBeenLastCalledWith("Lazer");
  view.rerender(
    <CategoryFilter
      categories={["Lazer", "Casa e cozinha"]}
      value="Lazer"
      onChange={onChange}
    />,
  );
  expect(trigger).toHaveTextContent("Lazer");
  await user.click(trigger);
  await user.click(screen.getByRole("option", { name: "Todas as categorias" }));
  expect(onChange).toHaveBeenLastCalledWith(null);
});
