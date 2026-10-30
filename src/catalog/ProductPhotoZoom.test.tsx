import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductPhotoZoom } from "./ProductPhotoZoom";

test("zoom tem limites, restauração e instrução acessível", async () => {
  const user = userEvent.setup();
  render(
    <ProductPhotoZoom
      src="blob:foto"
      name="Lanterna"
    />,
  );
  const more = screen.getByRole("button", { name: "Aproximar foto" });
  const less = screen.getByRole("button", { name: "Afastar foto" });
  const reset = screen.getByRole("button", {
    name: "Restaurar tamanho da foto",
  });
  expect(less).toBeDisabled();
  await user.click(more);
  expect(reset).toHaveTextContent("150%");
  for (let i = 0; i < 10; i++) await user.click(more);
  expect(reset).toHaveTextContent("400%");
  expect(more).toBeDisabled();
  await user.click(reset);
  expect(reset).toHaveTextContent("100%");
  expect(less).toBeDisabled();
  expect(screen.getByText(/Use dois dedos/)).toBeInTheDocument();
});
