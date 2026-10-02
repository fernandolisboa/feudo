import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { INSTITUTIONS } from "../institutions/institutions";
import { rankReservePlacements, type ReservePositionInput } from "./placement";
import { LIQUIDITY_MARKS, RATE_TYPES } from "./products";
import type { ReserveMarketRates } from "./yield";

const TODAY = "2026-10-02";

const rateArb = fc.option(fc.integer({ min: 0, max: 400_000 }), { nil: null });

const ratesArb: fc.Arbitrary<ReserveMarketRates> = fc.record({
  cdiAnnualPpm: rateArb,
  selicAnnualPpm: rateArb,
  selicTargetPpm: rateArb,
  ipca12MonthPpm: rateArb,
});

const positionArb: fc.Arbitrary<ReservePositionInput> = fc.record({
  id: fc.uuid(),
  name: fc.constantFrom("CDB", "LCI", "Tesouro Selic 2029", "Tesouro IPCA+ 2035", "Conta", "Fundo"),
  accountType: fc.constantFrom("checking", "savings", "investment"),
  productType: fc.option(
    fc.constantFrom("CDB", "RDB", "LCI", "LCA", "TREASURY", "MUTUAL_FUND", "STOCK", "NEW_THING"),
    { nil: null },
  ),
  balanceCentavos: fc.integer({ min: -100_000, max: 40_000_000 }),
  currency: fc.constantFrom("BRL", "BRL", "BRL", "USD"),
  rateType: fc.option(fc.constantFrom(...RATE_TYPES), { nil: null }),
  ratePpm: fc.option(fc.integer({ min: 0, max: 2_000_000 }), { nil: null }),
  acquisitionDate: fc.option(
    fc
      .date({
        min: new Date("2018-01-01T00:00:00Z"),
        max: new Date("2027-01-01T00:00:00Z"),
        noInvalidDate: true,
      })
      .map((date) => date.toISOString().slice(0, 10)),
    { nil: null },
  ),
  holderDocumentHash: fc.option(fc.constantFrom("holder-a", "holder-b"), { nil: null }),
  institutionId: fc.option(
    fc.constantFrom(...INSTITUTIONS.map((institution) => institution.id), "unknown-bank"),
    { nil: null },
  ),
  liquidityMark: fc.option(fc.constantFrom(...LIQUIDITY_MARKS), { nil: null }),
});

const positionsArb = fc.uniqueArray(positionArb, {
  selector: (position) => position.id,
  maxLength: 12,
});

describe("rankReservePlacements property tests", () => {
  it("never admits a position that is not redeemable within one business day", () => {
    fc.assert(
      fc.property(positionsArb, ratesArb, (positions, rates) => {
        const { ranked } = rankReservePlacements(positions, rates, TODAY);
        for (const entry of ranked) {
          expect(entry.liquidity).toBe("daily");
          expect(entry.position.currency).toBe("BRL");
          expect(entry.guarantee.kind).not.toBe("none");
        }
      }),
    );
  });

  it("orders by net real yield, highest first, with consecutive places", () => {
    fc.assert(
      fc.property(positionsArb, ratesArb, (positions, rates) => {
        const { ranked } = rankReservePlacements(positions, rates, TODAY);
        ranked.forEach((entry, index) => {
          expect(entry.place).toBe(index + 1);
          const next = ranked[index + 1];
          if (next) {
            expect(entry.yield?.realAnnualPpm ?? 0).toBeGreaterThanOrEqual(
              next.yield?.realAnnualPpm ?? 0,
            );
          }
        });
      }),
    );
  });

  it("puts every position in exactly one list, excluded ones always with a reason", () => {
    fc.assert(
      fc.property(positionsArb, ratesArb, (positions, rates) => {
        const { ranked, excluded } = rankReservePlacements(positions, rates, TODAY);
        const ids = [...ranked, ...excluded].map((entry) => entry.position.id).sort();
        expect(ids).toEqual(positions.map((position) => position.id).sort());
        for (const entry of excluded) {
          expect(entry.exclusions.length).toBeGreaterThan(0);
        }
        for (const entry of ranked) {
          expect(entry.exclusions).toEqual([]);
          expect(entry.yield).not.toBeNull();
        }
      }),
    );
  });

  it("never ranks a fund-covered position without headroom, nor reports negative headroom", () => {
    fc.assert(
      fc.property(positionsArb, ratesArb, (positions, rates) => {
        const { ranked, excluded } = rankReservePlacements(positions, rates, TODAY);
        for (const entry of [...ranked, ...excluded]) {
          if (entry.guarantee.kind === "fgc" || entry.guarantee.kind === "fgcoop") {
            expect(entry.guarantee.headroomCentavos).toBeGreaterThanOrEqual(0);
          }
        }
        for (const entry of ranked) {
          if (entry.guarantee.kind === "fgc" || entry.guarantee.kind === "fgcoop") {
            expect(entry.guarantee.headroomCentavos).toBeGreaterThan(0);
          }
        }
      }),
    );
  });

  it("does not depend on the order positions arrive in", () => {
    fc.assert(
      fc.property(positionsArb, ratesArb, (positions, rates) => {
        const forward = rankReservePlacements(positions, rates, TODAY).ranked;
        const backward = rankReservePlacements([...positions].reverse(), rates, TODAY).ranked;
        expect(backward.map((entry) => entry.position.id)).toEqual(
          forward.map((entry) => entry.position.id),
        );
      }),
    );
  });
});
