import { describe, expect, it } from "vitest";

import { accumulate12MonthIpca, InvalidMonthlyRatesCountError } from "./ipca";

describe("accumulate12MonthIpca", () => {
  it("compounds twelve equal monthly rates", () => {
    const monthlyRatesPpm = Array<number>(12).fill(4_400);
    expect(accumulate12MonthIpca(monthlyRatesPpm)).toBe(54_097);
  });

  it("compounds twelve mixed monthly rates, including a negative one", () => {
    const monthlyRatesPpm = [
      4_400, 3_800, 5_200, -1_000, 4_400, 4_400, 4_400, 4_400, 4_400, 4_400, 4_400, 4_400,
    ];
    expect(accumulate12MonthIpca(monthlyRatesPpm)).toBe(48_638);
  });

  it("returns zero when every monthly rate is zero", () => {
    expect(accumulate12MonthIpca(Array<number>(12).fill(0))).toBe(0);
  });

  it("throws InvalidMonthlyRatesCountError when fewer than 12 values are given", () => {
    expect(() => accumulate12MonthIpca(Array<number>(11).fill(0))).toThrow(
      InvalidMonthlyRatesCountError,
    );
  });

  it("throws InvalidMonthlyRatesCountError when more than 12 values are given", () => {
    expect(() => accumulate12MonthIpca(Array<number>(13).fill(0))).toThrow(
      InvalidMonthlyRatesCountError,
    );
  });
});

describe("InvalidMonthlyRatesCountError", () => {
  it("carries the received count", () => {
    try {
      accumulate12MonthIpca([]);
      throw new Error("expected accumulate12MonthIpca to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidMonthlyRatesCountError);
      expect((error as InvalidMonthlyRatesCountError).receivedCount).toBe(0);
    }
  });
});
