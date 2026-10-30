import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { CatalogPage } from "../catalog/CatalogPage";

for (const mode of ["cards", "folhear"]) {
  test(`carga inicial em ${mode} não anuncia lista vazia`, () => {
    window.history.replaceState(null, "", `/?visualizacao=${mode}`);
    const { rerender } = render(
      <CatalogPage
        products={[]}
        images={new Map()}
        catalogReady={false}
        loading
      />,
    );
    expect(screen.getByText("Carregando catálogo…")).toBeInTheDocument();
    expect(document.querySelector(".skeleton-region")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      screen.queryByText("Nenhum produto encontrado"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("0 produtos")).not.toBeInTheDocument();
    expect(document.querySelector(".skeleton")).toBeInTheDocument();
    rerender(
      <CatalogPage
        products={[]}
        images={new Map()}
        catalogReady
      />,
    );
    expect(screen.queryByText("Carregando catálogo")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhum produto encontrado")).toBeVisible();
  });
}
