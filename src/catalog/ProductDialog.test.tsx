import { expect, test, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "./ProductCard";
import { snapshotA } from "../test/fixtures";

test("foto abre inteira em um diálogo separado e Escape retorna aos detalhes sem adicionar", async () => {
  const user = userEvent.setup();
  const product = snapshotA.products[0];
  const onAdd = vi.fn();
  render(
    <ProductCard
      product={product}
      image="/foto.webp"
      onAdd={onAdd}
    />,
  );
  await user.click(screen.getByRole("button", { name: `Ver ${product.name}` }));
  const trigger = screen.getByRole("button", {
    name: `Ver foto completa de ${product.name}`,
  });
  await user.click(trigger);
  const photo = screen.getByRole("dialog", { name: `Foto de ${product.name}` });
  expect(within(photo).getByRole("img")).toHaveAttribute("src", "/foto.webp");
  await user.keyboard("{Escape}");
  expect(
    screen.queryByRole("dialog", { name: `Foto de ${product.name}` }),
  ).not.toBeInTheDocument();
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(onAdd).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: /^Fechar$/ }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("foto indisponível não oferece ampliação vazia", async () => {
  const user = userEvent.setup();
  const product = snapshotA.products[0];
  render(
    <ProductCard
      product={product}
      onAdd={() => {}}
    />,
  );
  await user.click(screen.getByRole("button", { name: `Ver ${product.name}` }));
  expect(
    screen.queryByRole("button", { name: /Ver foto completa/ }),
  ).not.toBeInTheDocument();
});

test("ampliação usa a foto da opção escolhida e mantém a seleção ao fechar", async () => {
  const user = userEvent.setup();
  const base = snapshotA.products[0];
  const product = {
    ...base,
    hasVariants: true,
    variantAttribute: "Potência",
    variants: [
      {
        id: "v1",
        code: `${base.code}-V01`,
        label: "5 W",
        priceCents: 3890,
        imagePath: "photos/v1.webp",
      },
      {
        id: "v2",
        code: `${base.code}-V02`,
        label: "3 W",
        priceCents: 2790,
        imagePath: "photos/v2.webp",
      },
    ],
  };
  render(
    <ProductCard
      product={product}
      images={
        new Map([
          [base.imagePath, "blob:parent"],
          ["photos/v1.webp", "blob:v1"],
          ["photos/v2.webp", "blob:v2"],
        ])
      }
      onAdd={() => {}}
    />,
  );
  await user.click(screen.getByRole("button", { name: `Ver ${product.name}` }));
  await user.click(screen.getByRole("button", { name: /Potência$/ }));
  await user.click(screen.getByRole("option", { name: /^3 W/ }));
  await user.click(
    screen.getByRole("button", {
      name: `Ver foto completa de ${product.name}`,
    }),
  );
  const photo = screen.getByRole("dialog", { name: `Foto de ${product.name}` });
  expect(within(photo).getByRole("img")).toHaveAttribute("src", "blob:v2");
  expect(
    within(photo).queryByRole("button", { name: /^Fechar$/ }),
  ).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: /Potência$/ })).toHaveTextContent(
    "3 W",
  );
  expect(
    screen.getByRole("button", { name: "Adicionar ao carrinho" }),
  ).toBeEnabled();
});
