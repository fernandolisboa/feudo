import { describe, expect, it } from "vitest";
import {
  add,
  subtract,
  formatBRL,
  decimalToCentavos,
  NonFiniteAmountError,
  NonIntegerAmountError,
  type Money,
} from "./money";

function brl(amountCentavos: number): Money {
  return { amountCentavos, currency: "BRL" };
}

describe("add", () => {
  it("sums two positive amounts", () => {
    expect(add(brl(100), brl(250))).toEqual(brl(350));
  });

  it("sums a positive and a negative amount", () => {
    expect(add(brl(100), brl(-40))).toEqual(brl(60));
  });

  it("throws NonIntegerAmountError when the first operand is not an integer", () => {
    expect(() => add(brl(1.5), brl(100))).toThrow(NonIntegerAmountError);
  });

  it("throws NonIntegerAmountError when the second operand is not an integer", () => {
    expect(() => add(brl(100), brl(1.5))).toThrow(NonIntegerAmountError);
  });
});

describe("subtract", () => {
  it("subtracts two positive amounts", () => {
    expect(subtract(brl(350), brl(100))).toEqual(brl(250));
  });

  it("produces a negative result when the subtrahend is larger", () => {
    expect(subtract(brl(100), brl(300))).toEqual(brl(-200));
  });

  it("throws NonIntegerAmountError when the first operand is not an integer", () => {
    expect(() => subtract(brl(1.5), brl(100))).toThrow(NonIntegerAmountError);
  });

  it("throws NonIntegerAmountError when the second operand is not an integer", () => {
    expect(() => subtract(brl(100), brl(1.5))).toThrow(NonIntegerAmountError);
  });
});

describe("formatBRL", () => {
  it("formats a value under a thousand", () => {
    expect(formatBRL(brl(4256))).toBe("R$ 42,56");
  });

  it("formats a value with thousands separators", () => {
    expect(formatBRL(brl(123456))).toBe("R$ 1.234,56");
  });

  it("formats a negative value with the sign before R$", () => {
    expect(formatBRL(brl(-123456))).toBe("-R$ 1.234,56");
  });

  it("formats zero", () => {
    expect(formatBRL(brl(0))).toBe("R$ 0,00");
  });

  it("pads single-digit centavos", () => {
    expect(formatBRL(brl(105))).toBe("R$ 1,05");
  });

  it("throws NonIntegerAmountError for a non-integer amount", () => {
    expect(() => formatBRL(brl(10.5))).toThrow(NonIntegerAmountError);
  });
});

describe("NonIntegerAmountError", () => {
  it("carries the offending amount", () => {
    try {
      add(brl(1.1), brl(0));
      throw new Error("expected add to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(NonIntegerAmountError);
      expect((error as NonIntegerAmountError).amountCentavos).toBe(1.1);
    }
  });
});

describe("decimalToCentavos", () => {
  it("converts a provider balance in currency units to integer centavos", () => {
    expect(decimalToCentavos(1234.56)).toBe(123456);
  });

  it("keeps binary float noise out of the result", () => {
    expect(decimalToCentavos(0.1 + 0.2)).toBe(30);
  });

  it("handles negative balances such as an overdrawn account", () => {
    expect(decimalToCentavos(-15.5)).toBe(-1550);
  });

  it("handles whole amounts and zero", () => {
    expect(decimalToCentavos(5000)).toBe(500000);
    expect(decimalToCentavos(0)).toBe(0);
  });

  it("throws NonFiniteAmountError for NaN and infinities", () => {
    expect(() => decimalToCentavos(Number.NaN)).toThrow(NonFiniteAmountError);
    expect(() => decimalToCentavos(Number.POSITIVE_INFINITY)).toThrow(NonFiniteAmountError);
  });

  it("carries the offending amount on the error", () => {
    try {
      decimalToCentavos(Number.NEGATIVE_INFINITY);
      throw new Error("expected decimalToCentavos to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(NonFiniteAmountError);
      expect((error as NonFiniteAmountError).amount).toBe(Number.NEGATIVE_INFINITY);
    }
  });
});
