import { describe, expect, it } from "vitest";

import { suggestionFingerprint } from "./fingerprint";

function tx(overrides: Partial<Parameters<typeof suggestionFingerprint>[0]> = {}) {
  return {
    description: "PADARIA DO ZE",
    amountCentavos: -1000,
    currency: "BRL",
    type: "debit" as const,
    ...overrides,
  };
}

describe("suggestionFingerprint", () => {
  it("is insensitive to case, accents and punctuation in the description", () => {
    const a = suggestionFingerprint(tx({ description: "Padaria do Zé!!" }));
    const b = suggestionFingerprint(tx({ description: "  padaria   do ze  " }));
    expect(a).toBe(b);
  });

  it("is insensitive to the amount's sign", () => {
    const a = suggestionFingerprint(tx({ amountCentavos: 1000 }));
    const b = suggestionFingerprint(tx({ amountCentavos: -1000 }));
    expect(a).toBe(b);
  });

  it("differs when the direction differs", () => {
    const debit = suggestionFingerprint(tx({ type: "debit" }));
    const credit = suggestionFingerprint(tx({ type: "credit" }));
    expect(debit).not.toBe(credit);
  });

  it("differs when the currency differs", () => {
    const brl = suggestionFingerprint(tx({ currency: "BRL" }));
    const usd = suggestionFingerprint(tx({ currency: "USD" }));
    expect(brl).not.toBe(usd);
  });

  it("differs when the amount differs", () => {
    const small = suggestionFingerprint(tx({ amountCentavos: -1000 }));
    const big = suggestionFingerprint(tx({ amountCentavos: -2000 }));
    expect(small).not.toBe(big);
  });

  it("differs when the normalized description differs", () => {
    const a = suggestionFingerprint(tx({ description: "PADARIA DO ZE" }));
    const b = suggestionFingerprint(tx({ description: "MERCADO DA ESQUINA" }));
    expect(a).not.toBe(b);
  });
});
