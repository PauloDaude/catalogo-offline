import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export async function chooseCategory(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(screen.getByRole("button", { name: /Categoria$/ }));
  await user.click(screen.getByRole("option", { name }));
}
