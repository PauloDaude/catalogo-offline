import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ProductListViewport } from "./ProductListViewport";
test("região continua utilizável sem ResizeObserver e reseta rolagem ao trocar página", () => {
  vi.stubGlobal("ResizeObserver", undefined);
  const view = (key: string) => (
    <section className="admin-surface">
      <ProductListViewport resetKey={key}>
        <p>Produto</p>
      </ProductListViewport>
      <nav className="admin-pagination" />
    </section>
  );
  const { rerender } = render(view("1"));
  const region = screen.getByRole("region", { name: "Lista de produtos" });
  region.scrollTop = 500;
  rerender(view("2"));
  expect(region.scrollTop).toBe(0);
  expect(region.tabIndex).toBe(0);
  vi.unstubAllGlobals();
});
