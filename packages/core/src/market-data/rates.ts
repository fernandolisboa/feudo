export const BUSINESS_DAYS_PER_YEAR = 252;

const PPM_SCALE = 1_000_000;

export type RatePpm = number;

export class InvalidRateError extends Error {
  readonly ratePpm: number;

  constructor(ratePpm: number) {
    super(
      `Rate must be finite and greater than -${String(PPM_SCALE)} ppm, received ${String(ratePpm)}`,
    );
    this.name = "InvalidRateError";
    this.ratePpm = ratePpm;
  }
}

function assertValidRate(ratePpm: RatePpm): void {
  if (!Number.isFinite(ratePpm) || ratePpm <= -PPM_SCALE) {
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
