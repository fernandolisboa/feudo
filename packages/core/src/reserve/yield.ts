import { BUSINESS_DAYS_PER_YEAR, type RatePpm } from "../market-data/rates";
import type { RateType, ReserveProduct } from "./products";

const PPM_SCALE = 1_000_000;
const BASIS_POINTS_SCALE = 10_000;
const MONTHS_IN_A_YEAR = 12;

// Law 8,177/1991, art. 12, II, as amended by Law 12,703/2012: poupança pays
// 0.5% a month while the Selic target is above 8.5% a year, else 70% of the
// Selic target; plus TR in both cases, which Feudo does not fetch, so the
// result understates poupança by the TR of the period.
export const POUPANCA_SELIC_THRESHOLD_PPM = 85_000;
export const POUPANCA_MONTHLY_RATE_PPM = 5_000;
export const POUPANCA_SELIC_SHARE_PPM = 700_000;

export type ReserveMarketRates = {
  cdiAnnualPpm: RatePpm | null;
  selicAnnualPpm: RatePpm | null;
  selicTargetPpm: RatePpm | null;
  ipca12MonthPpm: RatePpm | null;
};

export type GrossYield =
  | { status: "ok"; annualPpm: RatePpm }
  | { status: "rate_unknown" }
  | { status: "market_data_unavailable" };

function fraction(ppm: RatePpm): number {
  return ppm / PPM_SCALE;
}

function toPpm(value: number): RatePpm {
  return Math.round(value * PPM_SCALE);
}

// 252-business-day convention (ADR-0009): a position paying p% of CDI earns
// p% of each day's CDI, compounded over the year.
export function percentageOfCdiToAnnual(cdiAnnualPpm: RatePpm, percentagePpm: RatePpm): RatePpm {
  const cdiDaily = Math.pow(1 + fraction(cdiAnnualPpm), 1 / BUSINESS_DAYS_PER_YEAR) - 1;
  const positionDaily = cdiDaily * fraction(percentagePpm);
  return toPpm(Math.pow(1 + positionDaily, BUSINESS_DAYS_PER_YEAR) - 1);
}

export function inflationLinkedToAnnual(ipca12MonthPpm: RatePpm, spreadPpm: RatePpm): RatePpm {
  return toPpm((1 + fraction(ipca12MonthPpm)) * (1 + fraction(spreadPpm)) - 1);
}

export function poupancaAnnual(selicTargetPpm: RatePpm): RatePpm {
  if (selicTargetPpm > POUPANCA_SELIC_THRESHOLD_PPM) {
    return toPpm(Math.pow(1 + fraction(POUPANCA_MONTHLY_RATE_PPM), MONTHS_IN_A_YEAR) - 1);
  }
  return toPpm(fraction(selicTargetPpm) * fraction(POUPANCA_SELIC_SHARE_PPM));
}

function contractYield(
  rateType: RateType | null,
  ratePpm: RatePpm | null,
  rates: ReserveMarketRates,
): GrossYield {
  if (ratePpm === null || rateType === null) {
    return { status: "rate_unknown" };
  }
  switch (rateType) {
    case "fixed_annual":
      return { status: "ok", annualPpm: ratePpm };
    case "percentage_of_cdi":
      return rates.cdiAnnualPpm === null
        ? { status: "market_data_unavailable" }
        : { status: "ok", annualPpm: percentageOfCdiToAnnual(rates.cdiAnnualPpm, ratePpm) };
    case "inflation_linked":
      return rates.ipca12MonthPpm === null
        ? { status: "market_data_unavailable" }
        : { status: "ok", annualPpm: inflationLinkedToAnnual(rates.ipca12MonthPpm, ratePpm) };
    case "other":
      return { status: "rate_unknown" };
  }
}

// The position's rate converted to an annual nominal rate, whatever form it
// was quoted in (ADR-0009): "% of CDI" is one input form, not the basis.
export function grossAnnualYield(
  rule: ReserveProduct["yield"],
  position: { rateType: RateType | null; ratePpm: RatePpm | null },
  rates: ReserveMarketRates,
): GrossYield {
  switch (rule) {
    case "none":
      return { status: "ok", annualPpm: 0 };
    case "poupanca":
      return rates.selicTargetPpm === null
        ? { status: "market_data_unavailable" }
        : { status: "ok", annualPpm: poupancaAnnual(rates.selicTargetPpm) };
    case "selic":
      return rates.selicAnnualPpm === null
        ? { status: "market_data_unavailable" }
        : { status: "ok", annualPpm: rates.selicAnnualPpm };
    case "contract":
      return contractYield(position.rateType, position.ratePpm, rates);
  }
}

// Income tax falls on income only: a non-positive rate has nothing to tax.
export function netAnnualYield(grossAnnualPpm: RatePpm, taxBasisPoints: number): RatePpm {
  if (grossAnnualPpm <= 0) {
    return grossAnnualPpm;
  }
  return Math.round((grossAnnualPpm * (BASIS_POINTS_SCALE - taxBasisPoints)) / BASIS_POINTS_SCALE);
}

export function realAnnualYield(netAnnualPpm: RatePpm, ipca12MonthPpm: RatePpm): RatePpm {
  return toPpm((1 + fraction(netAnnualPpm)) / (1 + fraction(ipca12MonthPpm)) - 1);
}
