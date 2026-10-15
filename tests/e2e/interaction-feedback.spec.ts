import { test, expect } from "@playwright/test";
import { addToCart } from "./helpers";

test.use({ hasTouch: true });

test("catálogo abre sem Hero e carrinho mantém controles junto ao item no celular", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/?visualizacao=cards");
  await expect(
    page.getByRole("heading", { name: /Encontre o que/ }),
  ).toHaveCount(0);
  await addToCart(page, "Tesoura multiuso");
  await page.getByRole("button", { name: /Abrir carrinho/ }).click();
  const item = page.locator(".cart-item");
  const remove = item.getByRole("button", { name: "Remover Tesoura multiuso" });
  await expect(remove).toHaveText("");
  for (const width of [320, 360, 800]) {
    await page.setViewportSize({ width, height: 800 });
    const row = await item.boundingBox();
    const controls = await item.getByRole("group").boundingBox();
    const title = await item.getByRole("heading").boundingBox();
    const trash = await remove.boundingBox();
    expect(controls!.y - row!.y).toBeLessThan(80);
    expect(
      Math.abs(title!.y + title!.height / 2 - (trash!.y + trash!.height / 2)),
    ).toBeLessThan(20);
    expect(
      await page
        .locator(".cart-dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await expect(
      item.getByRole("button", {
        name: "Aumentar quantidade de Tesoura multiuso",
      }),
    ).toHaveCSS("min-height", "48px");
  }
  await remove.click();
  await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
});

test("carrossel usa foto proporcional, faixa sobreposta e o carrinho azul", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/?visualizacao=folhear");
  await expect(page.locator(".book-product")).toHaveCount(1);
  const photo = await page.locator(".book-product-photo").boundingBox();
  const caption = await page.locator(".book-product-caption").boundingBox();
  expect(photo!.height).toBeGreaterThanOrEqual(120);
  expect(caption!.y).toBeGreaterThanOrEqual(photo!.y);
  expect(caption!.y + caption!.height).toBeGreaterThan(
    photo!.y + photo!.height,
  );
  await expect(page.locator(".book-product .product-price")).toHaveCSS(
    "color",
    "rgb(29, 78, 216)",
  );
  await expect(page.locator(".book-product .discount-badge")).toHaveCSS(
    "background-color",
    "rgb(4, 166, 80)",
  );
  await expect(page.locator(".book-product .offer-label")).toBeVisible();
  await expect(page.getByRole("button", { name: /Abrir carrinho/ })).toHaveCSS(
    "background-color",
    "rgb(29, 78, 216)",
  );
});

test("arrastar à esquerda avança, direita retorna e gesto não abre detalhes", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/?visualizacao=folhear");
  const slide = page.locator(".book-viewport");
  await expect(slide).toBeVisible();
  await slide.scrollIntoViewIfNeeded();
  const box = await slide.boundingBox();
  const y = Math.max(80, box!.y + box!.height * 0.35);
  const session = await context.newCDPSession(page);
  async function drag(from: number, to: number) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: from, y }],
    });
    for (let step = 1; step <= 5; step++)
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: from + ((to - from) * step) / 5, y }],
      });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  await drag(260, 60);
  await expect(page.getByText("Produto 2 de 3")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await drag(60, 260);
  await expect(page.getByText("Produto 1 de 3")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Ver Panela para o dia a dia", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("arrastar com mouse respeita limites e arrasto curto não abre modal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 1000 });
  await page.goto("/?visualizacao=folhear");
  const viewport = page.locator(".book-viewport");
  await viewport.scrollIntoViewIfNeeded();
  const box = await viewport.boundingBox();
  const y = box!.y + box!.height * 0.65;
  async function drag(dx: number) {
    const x = box!.x + box!.width / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y, { steps: 8 });
    await page.mouse.up();
  }
  await drag(30);
  await expect(page.getByText("Produto 1 de 3")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await drag(120);
  await expect(page.getByText("Produto 1 de 3")).toBeVisible();
  await drag(-120);
  await drag(-120);
  await drag(-120);
  await expect(page.getByText("Produto 3 de 3")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await drag(120);
  await expect(page.getByText("Produto 2 de 3")).toBeVisible();
});

test("botão de carrinho na faixa adiciona sem abrir detalhes e funciona por teclado", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/?visualizacao=folhear");
  const add = page.getByRole("button", {
    name: "Adicionar Panela para o dia a dia ao carrinho",
  });
  await add.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Abrir carrinho, 1 item/ }),
  ).toBeVisible();
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: /Abrir carrinho, 2 itens/ }),
  ).toBeVisible();
  const box = (await add.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(48);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  await page.getByRole("button", { name: /Abrir carrinho/ }).click();
  await expect(page.locator(".cart-grand-total")).toHaveText("R$ 130,00");
});
