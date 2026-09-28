import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Kind, TransactionDirection } from "./categories/taxonomy";
import { summarizeLedger } from "./totals";

const KINDS_ARB = fc.constantFrom<Kind | null>("income", "fixed", "variable", "transfer", null);

const itemArb = fc.record({
  kind: KINDS_ARB,
  type: fc.constantFrom<TransactionDirection>("credit", "debit"),
  amount: fc
    .integer({ min: -1_000_000_00, max: 1_000_000_00 })
    .map((amountCentavos) => ({ amountCentavos, currency: "BRL" })),
});

describe("summarizeLedger property tests", () => {
  it("never lets a transfer or uncategorized item contribute to income or spending", () => {
    fc.assert(
      fc.property(fc.array(itemArb), (items) => {
        const onlyTransfersAndUncategorized = items.filter(
          (item) => item.kind === "transfer" || item.kind === null,
        );
        const withoutThem = items.filter((item) => item.kind !== "transfer" && item.kind !== null);

        const full = summarizeLedger(items);
        const partial = summarizeLedger(withoutThem);
        expect(full.income).toEqual(partial.income);
        expect(full.spending).toEqual(partial.spending);
        expect(full.transferCount).toBe(items.filter((item) => item.kind === "transfer").length);
        expect(onlyTransfersAndUncategorized.length + withoutThem.length).toBe(items.length);
      }),
    );
  });
});
