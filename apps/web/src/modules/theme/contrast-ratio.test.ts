import { describe, expect, it } from "vitest";

import { contrastRatio, InvalidHexColorError } from "./contrast-ratio";

describe("contrastRatio", () => {
  it("returns 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
  });

  it("returns 1 for identical colours", () => {
    expect(contrastRatio("#4f6f52", "#4f6f52")).toBeCloseTo(1, 5);
  });

  it("is symmetric regardless of argument order", () => {
    const a = contrastRatio("#2a2622", "#f4efe6");
    const b = contrastRatio("#f4efe6", "#2a2622");
    expect(a).toBeCloseTo(b, 10);
  });

  it("matches a known WCAG example (#767676 on white is ~4.54:1)", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 1);
  });

  it("accepts hex colours without a leading #", () => {
    expect(contrastRatio("000000", "ffffff")).toBeCloseTo(21, 2);
  });

  it("throws InvalidHexColorError for a malformed hex string", () => {
    expect(() => contrastRatio("#zzzzzz", "#ffffff")).toThrow(InvalidHexColorError);
    expect(() => contrastRatio("#fff", "#ffffff")).toThrow(InvalidHexColorError);
  });
});
