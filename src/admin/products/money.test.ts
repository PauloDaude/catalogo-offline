import { expect, test } from "vitest";
import { parseMoney, formatMoneyInput } from "./money";

test("converte reais sem arredondamento flutuante e rejeita entradas ambíguas", () => {
  expect(parseMoney("65,00")).toBe(6500);
  expect(parseMoney("1.234,56")).toBe(123456);
  expect(parseMoney("0,29")).toBe(29);
  expect(formatMoneyInput(10000)).toBe("100,00");
  for (const value of [
    "-1",
    "1,234",
    "1e5",
    "",
    "123.45",
    "999999999999999999",
  ])
    expect(() => parseMoney(value)).toThrow();
});
