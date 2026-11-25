import { describe, expect, it } from "vitest";
import {
  matchesPattern,
  normalizeDescription,
  rulePatternFromDescription,
  stripInstallmentMarker,
} from "./description";

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

  it("strips a trailing installment marker given as its own token", () => {
    expect(normalizeDescription("Some Store PARC03/10")).toBe("SOME STORE");
  });

  it("strips a trailing installment marker glued to the truncated merchant name", () => {
    expect(normalizeDescription("Some MerchantPARC10/12")).toBe("SOME MERCHANT");
  });

  it("leaves a description with no installment marker unchanged", () => {
    expect(normalizeDescription("Padaria Estrela")).toBe("PADARIA ESTRELA");
  });

  it("does not strip a PARC-like run that is not exactly two digits on each side", () => {
    expect(normalizeDescription("Loja PARC031/100")).toBe("LOJA PARC031 100");
    expect(normalizeDescription("Loja PARC3/1")).toBe("LOJA PARC3 1");
  });

  it("does not strip an installment marker that is not at the end of the description", () => {
    expect(normalizeDescription("Loja PARC03/10 taxa extra")).toBe("LOJA PARC03 10 TAXA EXTRA");
  });
});

describe("stripInstallmentMarker", () => {
  it("strips a trailing installment marker with no following digit pair, as an old stored pattern has it", () => {
    expect(stripInstallmentMarker("SOME STORE PARC03")).toBe("SOME STORE");
    expect(stripInstallmentMarker("SOME MERCHANTPARC10")).toBe("SOME MERCHANT");
  });

  it("is idempotent", () => {
    expect(stripInstallmentMarker(stripInstallmentMarker("SOME STORE PARC03"))).toBe("SOME STORE");
  });

  it("leaves a pattern with no installment marker unchanged", () => {
    expect(stripInstallmentMarker("SOME STORE")).toBe("SOME STORE");
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
