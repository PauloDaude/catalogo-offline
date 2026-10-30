import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { LoadingImage } from "./LoadingImage";

test("skeleton da foto termina ao carregar/falhar e reinicia quando a URL muda", () => {
  const loaded = vi.fn(),
    failed = vi.fn();
  const view = render(
    <LoadingImage
      src="/one.webp"
      alt="Foto"
      onLoad={loaded}
      onError={failed}
    />,
  );
  const image = screen.getByRole("img");
  expect(image).toHaveAttribute("data-loading", "true");
  fireEvent.load(image);
  expect(loaded).toHaveBeenCalledOnce();
  expect(image).not.toHaveAttribute("data-loading");
  view.rerender(
    <LoadingImage
      src="/two.webp"
      alt="Foto"
      onError={failed}
    />,
  );
  expect(image).toHaveAttribute("data-loading", "true");
  fireEvent.error(image);
  expect(failed).toHaveBeenCalledOnce();
  expect(image).not.toHaveAttribute("data-loading");
});

test("foto já completa no cache não mantém skeleton", () => {
  const cached = vi
    .spyOn(HTMLImageElement.prototype, "complete", "get")
    .mockReturnValue(true);
  try {
    render(
      <LoadingImage
        src="blob:cached"
        alt="Foto em cache"
      />,
    );
    expect(screen.getByRole("img")).not.toHaveAttribute("data-loading");
  } finally {
    cached.mockRestore();
  }
});
