export function parseMoney(value: string): number {
  const input = value.trim();

  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(input))
    throw new Error("Informe um preço como 65,00.");

  const [whole, fraction = ""] = input.replaceAll(".", "").split(",");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents > 999999999)
    throw new Error("O preço está acima do limite permitido.");

  return cents;
}

export function formatMoneyInput(cents: number): string {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}
