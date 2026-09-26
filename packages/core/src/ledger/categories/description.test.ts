import { describe, expect, it } from "vitest";
import { matchesPattern, normalizeDescription, rulePatternFromDescription } from "./description";

describe("normalizeDescription", () => {
  it("strips diacritics, uppercases and collapses punctuation to single spaces", () => {
    expect(normalizeDescription("Pix enviado – Condomínio 09/2026")).toBe(
      "PIX ENVIADO CONDOMINIO 09 2026",
    );
  });

  it("trims leading and trailing separators", () => {
    expect(normalizeDescription("  compra cartão  ")).toBe("COMPRA CARTAO");
  });

  it("returns an empty string for input with no alphanumeric characters", () => {
    expect(normalizeDescription("--- ***")).toBe("");
  });
});

describe("rulePatternFromDescription", () => {
  it("drops purely numeric tokens", () => {
    expect(rulePatternFromDescription("Pix enviado – Condomínio 09/2026")).toBe(
      "PIX ENVIADO CONDOMINIO",
    );
  });

  it("falls back to the normalized description when every token is numeric", () => {
    expect(rulePatternFromDescription("09/2026")).toBe("09 2026");
  });

  it("falls back to the normalized description for empty input", () => {
    expect(rulePatternFromDescription("   ")).toBe("");
  });

  it("keeps the longest contiguous non-numeric run when a number sits in the middle", () => {
    expect(rulePatternFromDescription("Pix enviado condominio residencial 0912 abc")).toBe(
      "PIX ENVIADO CONDOMINIO RESIDENCIAL",
    );
  });

  it("prefers the merchant after the card number when both runs are equally long", () => {
    expect(rulePatternFromDescription("Compra cartao 1234 Academia XYZ")).toBe("ACADEMIA XYZ");
  });

  it("drops a numeric token at the start of the description", () => {
    expect(rulePatternFromDescription("1234 Academia XYZ")).toBe("ACADEMIA XYZ");
  });

  it("drops a numeric token at the end of the description", () => {
    expect(rulePatternFromDescription("Academia XYZ 1234")).toBe("ACADEMIA XYZ");
  });

  it("returns a pattern that matches its own description even with a number in the middle", () => {
    const description = "Compra cartao 1234 Academia XYZ";
    const pattern = rulePatternFromDescription(description);
    expect(matchesPattern(normalizeDescription(description), pattern)).toBe(true);
  });
});

describe("matchesPattern", () => {
  it("matches a pattern that is a whole-token subsequence of the description", () => {
    expect(matchesPattern("PIX ENVIADO CONDOMINIO RESIDENCIAL", "PIX ENVIADO CONDOMINIO")).toBe(
      true,
    );
  });

  it("does not match a partial-token overlap", () => {
    expect(matchesPattern("UBER EATS PENDING", "UBER EAT")).toBe(false);
  });

  it("matches a pattern occurring in the middle of the description", () => {
    expect(matchesPattern("COMPRA CARTAO UBER EATS PENDING", "UBER EATS")).toBe(true);
  });

  it("never matches an empty pattern", () => {
    expect(matchesPattern("ANYTHING AT ALL", "")).toBe(false);
    expect(matchesPattern("", "")).toBe(false);
  });
});
