import { expect, test } from "@playwright/test";

test("foco das opções fica dentro do select sem outline cortado", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.className = "admin-select";
    fixture.innerHTML = `<button data-slot="select-trigger">Categoria</button>
      <div data-slot="select-list" tabindex="0"><div data-slot="select-item" tabindex="0" data-focused>Ferramentas</div></div>`;
    document.body.append(fixture);
  });
  const trigger = page.locator('[data-slot="select-trigger"]');
  await trigger.focus();
  await page.keyboard.press("Tab");
  const list = page.locator('[data-slot="select-list"]');
  await expect(list).toBeFocused();
  await expect(list).toHaveCSS("outline-style", "none");
  await page.keyboard.press("Tab");
  const item = page.locator('[data-slot="select-item"]');
  await expect(item).toBeFocused();
  await expect(item).toHaveCSS("outline-style", "none");
  await expect(item).not.toHaveCSS("box-shadow", "none");
});
