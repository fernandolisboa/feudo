import { parsePercentToRatePpm } from "./parse";

export const BUSINESS_DAYS_PER_YEAR = 252;

const PPM_SCALE = 1_000_000;

export type RatePpm = number;

export class InvalidRateError extends Error {
  readonly ratePpm: number;

  constructor(ratePpm: number) {
    super(
      `Rate must be an integer greater than -${String(PPM_SCALE)} ppm, received ${String(ratePpm)}`,
    );
    this.name = "InvalidRateError";
    this.ratePpm = ratePpm;
  }
}

const DAILY_PERCENT_MIN = -1;
const DAILY_PERCENT_MAX = 1;

export class InvalidDailyPercentError extends Error {
  readonly dailyPercentValue: string;

  constructor(dailyPercentValue: string) {
    super(
      `Daily percent must be within [${String(DAILY_PERCENT_MIN)}, ${String(DAILY_PERCENT_MAX)}], received "${dailyPercentValue}"`,
    );
    this.name = "InvalidDailyPercentError";
    this.dailyPercentValue = dailyPercentValue;
  }
}

export function assertValidRate(ratePpm: RatePpm): void {
  if (!Number.isInteger(ratePpm) || ratePpm <= -PPM_SCALE) {
    throw new InvalidRateError(ratePpm);
  }
}

function toRatePpm(fraction: number): RatePpm {
  return Math.round(fraction * PPM_SCALE);
}

export function annualizeDailyRate(dailyRatePpm: RatePpm): RatePpm {
  assertValidRate(dailyRatePpm);
  const dailyFraction = dailyRatePpm / PPM_SCALE;
  const annualFraction = Math.pow(1 + dailyFraction, BUSINESS_DAYS_PER_YEAR) - 1;
  return toRatePpm(annualFraction);
}

export function dailyizeAnnualRate(annualRatePpm: RatePpm): RatePpm {
  assertValidRate(annualRatePpm);
  const annualFraction = annualRatePpm / PPM_SCALE;
  const dailyFraction = Math.pow(1 + annualFraction, 1 / BUSINESS_DAYS_PER_YEAR) - 1;
  return toRatePpm(dailyFraction);
}

// SGS publishes the daily CDI with six decimals of percent (e.g. "0.053680"), one more
// significant digit than RatePpm (four decimals of percent) can hold; rounding the daily
// rate to ppm before compounding it over 252 days shifts the annualised result by whole
// basis points, so this reads the exact decimal string and quantises only the annual result.
export function annualizeDailyPercentToRatePpm(dailyPercentValue: string): RatePpm {
  parsePercentToRatePpm(dailyPercentValue);
  const dailyPercent = Number(dailyPercentValue);
  if (dailyPercent < DAILY_PERCENT_MIN || dailyPercent > DAILY_PERCENT_MAX) {
    throw new InvalidDailyPercentError(dailyPercentValue);
  }
  const dailyFraction = dailyPercent / 100;
  const annualFraction = Math.pow(1 + dailyFraction, BUSINESS_DAYS_PER_YEAR) - 1;
  const annualRatePpm = toRatePpm(annualFraction);
  assertValidRate(annualRatePpm);
  return annualRatePpm;
}
