import { describe, expect, it } from "vitest";

import { formatRatePpmAsPercent, InvalidPercentStringError, parsePercentToRatePpm } from "./parse";

describe("parsePercentToRatePpm", () => {
  it("parses a whole percentage", () => {
    expect(parsePercentToRatePpm("13.65")).toBe(136_500);
  });

  it("parses a percentage with more decimal places than basis points can hold", () => {
    expect(parsePercentToRatePpm("0.053680")).toBe(537);
  });

  it("parses a negative percentage", () => {
    expect(parsePercentToRatePpm("-0.10")).toBe(-1_000);
  });

  it("parses zero", () => {
    expect(parsePercentToRatePpm("0")).toBe(0);
  });

  it("throws InvalidPercentStringError for a non-numeric string", () => {
    expect(() => parsePercentToRatePpm("not-a-number")).toThrow(InvalidPercentStringError);
  });

  it("throws InvalidPercentStringError for a comma decimal separator", () => {
    expect(() => parsePercentToRatePpm("13,65")).toThrow(InvalidPercentStringError);
  });

  it("throws InvalidPercentStringError for an empty string", () => {
    expect(() => parsePercentToRatePpm("")).toThrow(InvalidPercentStringError);
  });
});

describe("formatRatePpmAsPercent", () => {
  it("formats a rate to two decimal places by default", () => {
    expect(formatRatePpmAsPercent(48_638)).toBe("4.86");
  });

  it("formats zero", () => {
    expect(formatRatePpmAsPercent(0)).toBe("0.00");
  });

  it("formats a negative rate", () => {
    expect(formatRatePpmAsPercent(-1_000)).toBe("-0.10");
  });

  it("round-trips through parsePercentToRatePpm at two decimal places", () => {
    expect(parsePercentToRatePpm(formatRatePpmAsPercent(136_500))).toBe(136_500);
  });
});

describe("InvalidPercentStringError", () => {
  it("carries the offending value", () => {
    try {
      parsePercentToRatePpm("nope");
      throw new Error("expected parsePercentToRatePpm to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPercentStringError);
      expect((error as InvalidPercentStringError).value).toBe("nope");
    }
  });
});
