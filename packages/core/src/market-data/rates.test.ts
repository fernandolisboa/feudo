import { describe, expect, it } from "vitest";

import { InvalidPercentStringError } from "./parse";
import {
  annualizeDailyPercentToRatePpm,
  annualizeDailyRate,
  dailyizeAnnualRate,
  InvalidDailyPercentError,
  InvalidRateError,
} from "./rates";

describe("annualizeDailyRate", () => {
  it("compounds a daily rate over 252 business days", () => {
    expect(annualizeDailyRate(537)).toBe(144_866);
  });

  it("returns zero for a zero daily rate", () => {
    expect(annualizeDailyRate(0)).toBe(0);
  });

  it("throws InvalidRateError for a rate at or below -100%", () => {
    expect(() => annualizeDailyRate(-1_000_000)).toThrow(InvalidRateError);
  });

  it("throws InvalidRateError for a non-finite rate", () => {
    expect(() => annualizeDailyRate(Number.NaN)).toThrow(InvalidRateError);
  });
});

describe("dailyizeAnnualRate", () => {
  it("derives the daily rate from an annual rate", () => {
    expect(dailyizeAnnualRate(136_500)).toBe(508);
  });

  it("returns zero for a zero annual rate", () => {
    expect(dailyizeAnnualRate(0)).toBe(0);
  });

  it("throws InvalidRateError for a rate at or below -100%", () => {
    expect(() => dailyizeAnnualRate(-1_000_000)).toThrow(InvalidRateError);
  });

  it("throws InvalidRateError for a non-finite rate", () => {
    expect(() => dailyizeAnnualRate(Number.POSITIVE_INFINITY)).toThrow(InvalidRateError);
  });
});

describe("annualizeDailyPercentToRatePpm", () => {
  it("annualises the exact decimal string without rounding the daily rate to ppm first", () => {
    expect(annualizeDailyPercentToRatePpm("0.053680")).toBe(144_808);
  });

  it("differs from rounding the daily rate to ppm before compounding", () => {
    const fromExactString = annualizeDailyPercentToRatePpm("0.053680");
    const fromRoundedPpm = annualizeDailyRate(537);
    expect(fromExactString).not.toBe(fromRoundedPpm);
    expect((fromExactString / 10_000).toFixed(2)).toBe("14.48");
    expect((fromRoundedPpm / 10_000).toFixed(2)).toBe("14.49");
  });

  it("returns zero for a zero daily rate", () => {
    expect(annualizeDailyPercentToRatePpm("0")).toBe(0);
  });

  it("throws InvalidPercentStringError for a malformed decimal string", () => {
    expect(() => annualizeDailyPercentToRatePpm("not-a-number")).toThrow(InvalidPercentStringError);
  });

  it.each(["-201", "500"])(
    "throws InvalidDailyPercentError for a daily percent of %s outside [-1, 1]",
    (dailyPercentValue) => {
      expect(() => annualizeDailyPercentToRatePpm(dailyPercentValue)).toThrow(
        InvalidDailyPercentError,
      );
    },
  );
});

describe("InvalidRateError", () => {
  it("carries the offending rate", () => {
    try {
      annualizeDailyRate(-2_000_000);
      throw new Error("expected annualizeDailyRate to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidRateError);
      expect((error as InvalidRateError).ratePpm).toBe(-2_000_000);
    }
  });
});
