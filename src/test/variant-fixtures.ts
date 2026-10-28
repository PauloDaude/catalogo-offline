export const family = {
  id: "parent",
  code: "P1000",
  name: "Processador",
  category: "Cozinha",
  imagePath: "photos/a.jpg",
  hasVariants: true,
  variantAttribute: "Capacidade",
  variants: [
    { id: "small", code: "P1000-V01", label: "500 ml", priceCents: 1490 },
    {
      id: "large",
      code: "P1000-V02",
      label: "900 ml",
      priceCents: 2190,
      previousPriceCents: 2500,
      imagePath: "photos/b.jpg",
    },
  ],
};
