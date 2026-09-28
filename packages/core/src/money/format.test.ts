import { describe, expect, it } from "vitest";
import { formatBasisPointsPercent, formatCompactReais } from "./format";

describe("formatBasisPointsPercent", () => {
  it("formats a whole percent without a decimal", () => {
    expect(formatBasisPointsPercent(3500)).toBe("35%");
  });

  it("formats a percent with one decimal", () => {
    expect(formatBasisPointsPercent(460)).toBe("4,6%");
  });

  it("formats a negative percent with a leading hyphen", () => {
    expect(formatBasisPointsPercent(-1234)).toBe("-12,3%");
  });

  it("rounds a small percent half away from zero to one decimal", () => {
    expect(formatBasisPointsPercent(5)).toBe("0,1%");
  });

  it("formats zero without a sign or decimal", () => {
    expect(formatBasisPointsPercent(0)).toBe("0%");
  });

  it("rounds a value that would round to zero, showing no sign", () => {
    expect(formatBasisPointsPercent(-4)).toBe("0%");
  });

  it("drops a trailing zero decimal after rounding up", () => {
    expect(formatBasisPointsPercent(995)).toBe("10%");
  });

  it("formats a large negative rate", () => {
    expect(formatBasisPointsPercent(-10000)).toBe("-100%");
  });
});

describe("formatCompactReais", () => {
  it("formats an amount under a thousand reais as whole reais", () => {
    expect(formatCompactReais(95000)).toBe("950");
  });

  it("formats zero as a whole real", () => {
    expect(formatCompactReais(0)).toBe("0");
  });

  it("formats thousands with one decimal and a 'mil' suffix", () => {
    expect(formatCompactReais(1840000)).toBe("18,4 mil");
  });

  it("drops a trailing zero decimal for an exact thousand", () => {
    expect(formatCompactReais(100000)).toBe("1 mil");
  });

  it("formats millions with one decimal and a 'mi' suffix", () => {
    expect(formatCompactReais(250000000)).toBe("2,5 mi");
  });

  it("bumps a value that rounds up to a million into the 'mi' unit instead of '1.000 mil'", () => {
    expect(formatCompactReais(99999999)).toBe("1 mi");
  });

  it("keeps a leading hyphen for a negative amount", () => {
    expect(formatCompactReais(-1840000)).toBe("-18,4 mil");
  });

  it("keeps a leading hyphen for a negative amount under a thousand reais", () => {
    expect(formatCompactReais(-95000)).toBe("-950");
  });

  it("rounds an exact thousand reais boundary up into the 'mil' unit", () => {
    expect(formatCompactReais(99950)).toBe("1 mil");
  });
});
