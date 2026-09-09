import type { RatePpm } from "./rates";

const DECIMAL_STRING_PATTERN = /^-?\d+(\.\d+)?$/;
const PERCENT_TO_PPM_FACTOR = 10_000;

export class InvalidPercentStringError extends Error {
  readonly value: string;

  constructor(value: string) {
    super(`Expected a decimal percentage string, received ${JSON.stringify(value)}`);
    this.name = "InvalidPercentStringError";
    this.value = value;
  }
}

export function parsePercentToRatePpm(percentValue: string): RatePpm {
  if (!DECIMAL_STRING_PATTERN.test(percentValue)) {
    throw new InvalidPercentStringError(percentValue);
  }
  return Math.round(Number(percentValue) * PERCENT_TO_PPM_FACTOR);
}

export function formatRatePpmAsPercent(ratePpm: RatePpm, decimalPlaces = 2): string {
  return (ratePpm / PERCENT_TO_PPM_FACTOR).toFixed(decimalPlaces);
}
