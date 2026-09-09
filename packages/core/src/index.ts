export type { Money } from "./money/money";
export { add, subtract, formatBRL, NonIntegerAmountError } from "./money/money";

export type { RatePpm } from "./market-data/rates";
export {
  BUSINESS_DAYS_PER_YEAR,
  annualizeDailyRate,
  dailyizeAnnualRate,
  InvalidRateError,
} from "./market-data/rates";
export { accumulate12MonthIpca, InvalidMonthlyRatesCountError } from "./market-data/ipca";
export { parsePercentToRatePpm, InvalidPercentStringError } from "./market-data/parse";
