import { expect, test } from "vitest";
import { toggleProduct, togglePage, pageSelection } from "./selection";
const a = { id: "a", name: "A", code: "P001", active: true, version: 1 };
const b = { ...a, id: "b" },
  c = { ...a, id: "c" };
test("seleção entre páginas e marcação parcial não inclui produtos não marcados", () => {
  let selected = toggleProduct(new Map(), a);
  expect(pageSelection(selected, [a, b])).toBe("partial");
  selected = togglePage(selected, [a, b]);
  selected = togglePage(selected, [c]);
  expect(selected.size).toBe(3);
  selected = togglePage(selected, [a, b]);
  expect([...selected.keys()]).toEqual(["c"]);
});
test("versão selecionada é capturada sem acompanhar edição silenciosamente", () => {
  const selected = toggleProduct(new Map(), a);
  const newer = { ...a, version: 9 };
  expect(pageSelection(selected, [newer])).toBe("all");
  expect(selected.get("a")?.version).toBe(1);
  expect(toggleProduct(selected, newer).size).toBe(0);
});
