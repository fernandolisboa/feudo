import { describe, expect, it } from "vitest";

import { formatMoney } from "./format-money";

describe("formatMoney", () => {
  it("formats centavos in Brazilian reais with Brazilian separators", () => {
    expect(formatMoney(123456, "BRL")).toBe("R$ 1.234,56");
    expect(formatMoney(-35010, "BRL")).toBe("-R$ 350,10");
  });

  it("keeps the currency symbol of a foreign account", () => {
    expect(formatMoney(12000, "USD")).toBe("US$ 120,00");
  });
});
