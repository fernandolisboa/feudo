import { describe, expect, it } from "vitest";

import { annualizeDailyRate, dailyizeAnnualRate, InvalidRateError } from "./rates";

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
