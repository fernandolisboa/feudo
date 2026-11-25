import { describe, expect, it } from "vitest";

import { batchForAiSuggestion, type AiBatchRow } from "./ai-batch";
import { suggestionFingerprint } from "./fingerprint";

function row(overrides: Partial<AiBatchRow> = {}): AiBatchRow {
  return {
    id: "t1",
    description: "PADARIA DO ZE",
    type: "debit",
    amountCentavos: -1000,
    currency: "BRL",
    eligible: true,
    ...overrides,
  };
}

describe("batchForAiSuggestion", () => {
  it("groups rows that share a fingerprint into one group", () => {
    const rows = [
      row({ id: "a", description: "Padaria do Zé" }),
      row({ id: "b", description: "PADARIA DO ZE" }),
    ];

    const groups = batchForAiSuggestion(rows, new Set(), Infinity);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.transactionIds).toEqual(["a", "b"]);
    expect(groups[0]?.description).toBe("Padaria do Zé");
  });

  it("leaves out ineligible rows", () => {
    const rows = [row({ id: "a", eligible: false }), row({ id: "b" })];

    const groups = batchForAiSuggestion(rows, new Set(), Infinity);

    expect(groups.flatMap((group) => group.transactionIds)).toEqual(["b"]);
  });

  it("leaves out a row already asked, and every other row sharing its fingerprint", () => {
    const rows = [
      row({ id: "a", description: "UBER TRIP" }),
      row({ id: "b", description: "uber trip" }),
      row({ id: "c", description: "IFOOD" }),
    ];

    const groups = batchForAiSuggestion(rows, new Set(["a"]), Infinity);

    expect(groups.flatMap((group) => group.transactionIds)).toEqual(["c"]);
  });

  it("truncates to the limit, preserving queue order", () => {
    const rows = [
      row({ id: "a", description: "LOJA A" }),
      row({ id: "b", description: "LOJA B" }),
      row({ id: "c", description: "LOJA C" }),
    ];

    const groups = batchForAiSuggestion(rows, new Set(), 2);

    expect(groups.map((group) => group.transactionIds[0])).toEqual(["a", "b"]);
  });

  it("reports the absolute amount and the direction and currency of the group", () => {
    const groups = batchForAiSuggestion(
      [row({ id: "a", amountCentavos: -4200, currency: "BRL", type: "debit" })],
      new Set(),
      Infinity,
    );

    expect(groups[0]).toMatchObject({
      absoluteAmountCentavos: 4200,
      currency: "BRL",
      type: "debit",
    });
  });

  it("never mixes two different fingerprints into one group", () => {
    const rows = [row({ id: "a", amountCentavos: -1000 }), row({ id: "b", amountCentavos: -2000 })];

    const groups = batchForAiSuggestion(rows, new Set(), Infinity);

    expect(groups).toHaveLength(2);
    for (const group of groups) {
      const fingerprints = new Set(
        group.transactionIds.map((id) => {
          const own = rows.find((candidate) => candidate.id === id);
          return own ? suggestionFingerprint(own) : null;
        }),
      );
      expect(fingerprints.size).toBe(1);
    }
  });
});
