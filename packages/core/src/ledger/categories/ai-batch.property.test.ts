import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { batchForAiSuggestion, type AiBatchRow } from "./ai-batch";
import { suggestionFingerprint } from "./fingerprint";

const rowArb = fc.record({
  description: fc.constantFrom("PADARIA DO ZE", "UBER TRIP 99", "PIX RECEBIDO MARIA", "***"),
  type: fc.constantFrom("credit" as const, "debit" as const),
  amountCentavos: fc.oneof(
    fc.constantFrom(-1000, 1000, -2000, 2000, -4200),
    fc.integer({ min: -1_000_000_00, max: 1_000_000_00 }),
  ),
  currency: fc.constantFrom("BRL", "BRL", "USD"),
  eligible: fc.boolean(),
});

const rowsArb = fc
  .array(rowArb, { maxLength: 30 })
  .map((items): AiBatchRow[] =>
    items.map((item, index) => ({ ...item, id: `t${String(index).padStart(3, "0")}` })),
  );

const askedIdsArb = (rows: readonly AiBatchRow[]) =>
  fc.subarray(rows.map((row) => row.id)).map((ids) => new Set(ids));

const limitArb = fc.oneof(fc.constant(Infinity), fc.integer({ min: 0, max: 10 }));

describe("batchForAiSuggestion property tests", () => {
  it("only ever returns eligible, unasked ids, each at most once, within the limit", () => {
    fc.assert(
      fc.property(
        rowsArb.chain((rows) => fc.tuple(fc.constant(rows), askedIdsArb(rows), limitArb)),
        ([rows, askedIds, limit]) => {
          const groups = batchForAiSuggestion(rows, askedIds, limit);
          const byId = new Map(rows.map((row) => [row.id, row]));
          const seen = new Set<string>();

          expect(groups.length).toBeLessThanOrEqual(limit);
          for (const group of groups) {
            for (const id of group.transactionIds) {
              expect(seen.has(id)).toBe(false);
              seen.add(id);
              const own = byId.get(id);
              expect(own?.eligible).toBe(true);
              expect(askedIds.has(id)).toBe(false);
            }
          }
        },
      ),
    );
  });

  it("never lets a group share a fingerprint with an asked row, and keeps each group single-fingerprint", () => {
    fc.assert(
      fc.property(
        rowsArb.chain((rows) => fc.tuple(fc.constant(rows), askedIdsArb(rows), limitArb)),
        ([rows, askedIds, limit]) => {
          const groups = batchForAiSuggestion(rows, askedIds, limit);
          const byId = new Map(rows.map((row) => [row.id, row]));
          const askedFingerprints = new Set(
            rows.filter((row) => askedIds.has(row.id)).map((row) => suggestionFingerprint(row)),
          );
          const groupFingerprints = new Set<string>();

          for (const group of groups) {
            const fingerprints = new Set(
              group.transactionIds.map((id) => {
                const own = byId.get(id);
                if (!own) throw new Error("missing row");
                return suggestionFingerprint(own);
              }),
            );
            expect(fingerprints.size).toBe(1);
            const [fingerprint] = fingerprints;
            if (fingerprint !== undefined) {
              expect(askedFingerprints.has(fingerprint)).toBe(false);
              expect(groupFingerprints.has(fingerprint)).toBe(false);
              groupFingerprints.add(fingerprint);
            }
          }
        },
      ),
    );
  });

  it("preserves queue order", () => {
    fc.assert(
      fc.property(
        rowsArb.chain((rows) => fc.tuple(fc.constant(rows), askedIdsArb(rows))),
        ([rows, askedIds]) => {
          const groups = batchForAiSuggestion(rows, askedIds, Infinity);
          const firstIndexOf = (id: string) => rows.findIndex((row) => row.id === id);
          const groupFirstIndices = groups.map((group) =>
            firstIndexOf(group.transactionIds[0] ?? ""),
          );
          const sorted = [...groupFirstIndices].sort((a, b) => a - b);
          expect(groupFirstIndices).toEqual(sorted);
        },
      ),
    );
  });

  it("with limit Infinity, covers every eligible, unasked, non-asked-fingerprint row", () => {
    fc.assert(
      fc.property(
        rowsArb.chain((rows) => fc.tuple(fc.constant(rows), askedIdsArb(rows))),
        ([rows, askedIds]) => {
          const askedFingerprints = new Set(
            rows.filter((row) => askedIds.has(row.id)).map((row) => suggestionFingerprint(row)),
          );
          const expected = rows
            .filter(
              (row) =>
                row.eligible &&
                !askedIds.has(row.id) &&
                !askedFingerprints.has(suggestionFingerprint(row)),
            )
            .map((row) => row.id);

          const groups = batchForAiSuggestion(rows, askedIds, Infinity);
          const covered = groups.flatMap((group) => group.transactionIds);

          expect([...covered].sort()).toEqual([...expected].sort());
        },
      ),
    );
  });
});
