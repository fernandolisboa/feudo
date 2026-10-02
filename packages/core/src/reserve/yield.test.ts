import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  grossAnnualYield,
  inflationLinkedToAnnual,
  netAnnualYield,
  percentageOfCdiToAnnual,
  poupancaAnnual,
  realAnnualYield,
  type ReserveMarketRates,
} from "./yield";

const RATES: ReserveMarketRates = {
  cdiAnnualPpm: 149_000,
  selicAnnualPpm: 150_000,
  selicTargetPpm: 150_000,
  ipca12MonthPpm: 52_000,
};

describe("percentageOfCdiToAnnual", () => {
  it("compounds the share of each day's CDI over 252 business days", () => {
    expect(percentageOfCdiToAnnual(149_000, 1_000_000)).toBe(149_000);
    expect(percentageOfCdiToAnnual(149_000, 1_100_000)).toBe(165_065);
    expect(percentageOfCdiToAnnual(149_000, 920_000)).toBe(136_307);
  });

  it("is non-decreasing in the share of CDI", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400_000 }),
        fc.integer({ min: 0, max: 2_000_000 }),
        fc.integer({ min: 0, max: 2_000_000 }),
        (cdi, a, b) => {
          const [low, high] = a <= b ? [a, b] : [b, a];
          expect(percentageOfCdiToAnnual(cdi, low)).toBeLessThanOrEqual(
            percentageOfCdiToAnnual(cdi, high),
          );
        },
      ),
    );
  });
});

describe("inflationLinkedToAnnual", () => {
  it("compounds the spread over the 12-month IPCA", () => {
    expect(inflationLinkedToAnnual(52_000, 60_000)).toBe(115_120);
  });
});

describe("poupancaAnnual", () => {
  it("pays 0.5% a month while the Selic target is above 8.5%", () => {
    expect(poupancaAnnual(150_000)).toBe(61_678);
    expect(poupancaAnnual(85_001)).toBe(61_678);
  });

  it("pays 70% of the Selic target at or below 8.5%", () => {
    expect(poupancaAnnual(85_000)).toBe(59_500);
    expect(poupancaAnnual(80_000)).toBe(56_000);
  });
});

describe("grossAnnualYield", () => {
  it("earns nothing on a balance with no yield rule", () => {
    expect(grossAnnualYield("none", { rateType: null, ratePpm: null }, RATES)).toEqual({
      status: "ok",
      annualPpm: 0,
    });
  });

  it("uses the effective Selic for Tesouro Selic, whatever rate the provider sent", () => {
    expect(grossAnnualYield("selic", { rateType: "other", ratePpm: 1_000_000 }, RATES)).toEqual({
      status: "ok",
      annualPpm: 150_000,
    });
  });

  it("reads a fixed annual rate as is", () => {
    expect(
      grossAnnualYield("contract", { rateType: "fixed_annual", ratePpm: 125_000 }, RATES),
    ).toEqual({ status: "ok", annualPpm: 125_000 });
  });

  it("converts % of CDI and IPCA+ to annual nominal", () => {
    expect(
      grossAnnualYield("contract", { rateType: "percentage_of_cdi", ratePpm: 1_100_000 }, RATES),
    ).toEqual({ status: "ok", annualPpm: 165_065 });
    expect(
      grossAnnualYield("contract", { rateType: "inflation_linked", ratePpm: 60_000 }, RATES),
    ).toEqual({ status: "ok", annualPpm: 115_120 });
  });

  it("reports an unknown rate when the contract gives none it can read", () => {
    expect(grossAnnualYield("contract", { rateType: null, ratePpm: 100_000 }, RATES)).toEqual({
      status: "rate_unknown",
    });
    expect(
      grossAnnualYield("contract", { rateType: "fixed_annual", ratePpm: null }, RATES),
    ).toEqual({ status: "rate_unknown" });
    expect(grossAnnualYield("contract", { rateType: "other", ratePpm: 1_000_000 }, RATES)).toEqual({
      status: "rate_unknown",
    });
  });

  it("reports missing market data instead of inventing an indicator", () => {
    const empty: ReserveMarketRates = {
      cdiAnnualPpm: null,
      selicAnnualPpm: null,
      selicTargetPpm: null,
      ipca12MonthPpm: null,
    };
    const unavailable = { status: "market_data_unavailable" };
    expect(grossAnnualYield("poupanca", { rateType: null, ratePpm: null }, empty)).toEqual(
      unavailable,
    );
    expect(grossAnnualYield("selic", { rateType: null, ratePpm: null }, empty)).toEqual(
      unavailable,
    );
    expect(
      grossAnnualYield("contract", { rateType: "percentage_of_cdi", ratePpm: 1_000_000 }, empty),
    ).toEqual(unavailable);
    expect(
      grossAnnualYield("contract", { rateType: "inflation_linked", ratePpm: 60_000 }, empty),
    ).toEqual(unavailable);
  });
});

describe("netAnnualYield", () => {
  it("takes the income tax off a positive rate", () => {
    expect(netAnnualYield(165_065, 1750)).toBe(136_179);
    expect(netAnnualYield(100_000, 0)).toBe(100_000);
  });

  it("leaves a non-positive rate untaxed", () => {
    expect(netAnnualYield(0, 2250)).toBe(0);
    expect(netAnnualYield(-10_000, 2250)).toBe(-10_000);
  });

  it("never exceeds the gross rate nor goes below it times the worst bracket", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.constantFrom(0, 1500, 1750, 2000, 2250),
        (gross, tax) => {
          const net = netAnnualYield(gross, tax);
          expect(net).toBeLessThanOrEqual(gross);
          expect(net).toBeGreaterThanOrEqual(Math.floor(gross * 0.775));
        },
      ),
    );
  });
});

describe("realAnnualYield", () => {
  it("discounts the 12-month IPCA", () => {
    expect(realAnnualYield(136_179, 52_000)).toBe(80_018);
    expect(realAnnualYield(52_000, 52_000)).toBe(0);
  });

  it("is negative when inflation outruns the net rate", () => {
    expect(realAnnualYield(0, 52_000)).toBeLessThan(0);
  });
});
