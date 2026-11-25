import { describe, expect, it } from "vitest";

import { isSameAmount, sameAmountGapCentavos } from "./same-amount";

function brl(amountCentavos: number) {
  return { amountCentavos, currency: "BRL" };
}

describe("sameAmountGapCentavos", () => {
  it("is zero for equal absolute amounts, whatever the sign", () => {
    expect(sameAmountGapCentavos(brl(-3816), brl(3816))).toBe(0);
    expect(sameAmountGapCentavos(brl(0), brl(0))).toBe(0);
  });

  it("is the difference for amounts a few centavos apart", () => {
    expect(sameAmountGapCentavos(brl(3816), brl(3819))).toBe(3);
    expect(sameAmountGapCentavos(brl(-3819), brl(3816))).toBe(3);
    expect(sameAmountGapCentavos(brl(100), brl(101))).toBe(1);
  });

  it("allows a difference of 10 centavos and not of 11", () => {
    expect(sameAmountGapCentavos(brl(150000), brl(150010))).toBe(10);
    expect(sameAmountGapCentavos(brl(150000), brl(150011))).toBeNull();
  });

  it("allows a difference of 1% of the larger amount and no more", () => {
    expect(sameAmountGapCentavos(brl(500), brl(505))).toBe(5);
    expect(sameAmountGapCentavos(brl(500), brl(509))).toBeNull();
    expect(sameAmountGapCentavos(brl(99), brl(100))).toBe(1);
    expect(sameAmountGapCentavos(brl(98), brl(99))).toBeNull();
    expect(sameAmountGapCentavos(brl(0), brl(1))).toBeNull();
  });

  it("is never the same amount across currencies", () => {
    expect(sameAmountGapCentavos(brl(3816), { amountCentavos: 3816, currency: "USD" })).toBeNull();
  });
});

describe("isSameAmount", () => {
  it("says whether there is a gap at all", () => {
    expect(isSameAmount(brl(3816), brl(3819))).toBe(true);
    expect(isSameAmount(brl(500), brl(509))).toBe(false);
  });
});
