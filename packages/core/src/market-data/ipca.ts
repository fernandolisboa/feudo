import { assertValidRate, type RatePpm } from "./rates";

const PPM_SCALE = 1_000_000;
const MONTHS_IN_A_YEAR = 12;

export class InvalidMonthlyRatesCountError extends Error {
  readonly receivedCount: number;

  constructor(receivedCount: number) {
    super(
      `Expected exactly ${String(MONTHS_IN_A_YEAR)} monthly rates, received ${String(receivedCount)}`,
    );
    this.name = "InvalidMonthlyRatesCountError";
    this.receivedCount = receivedCount;
  }
}

export function accumulate12MonthIpca(monthlyRatesPpm: readonly RatePpm[]): RatePpm {
  if (monthlyRatesPpm.length !== MONTHS_IN_A_YEAR) {
    throw new InvalidMonthlyRatesCountError(monthlyRatesPpm.length);
  }
  for (const ratePpm of monthlyRatesPpm) {
    assertValidRate(ratePpm);
  }

  const accumulatedFraction =
    monthlyRatesPpm.reduce((factor, ratePpm) => factor * (1 + ratePpm / PPM_SCALE), 1) - 1;

  const accumulatedRatePpm = Math.round(accumulatedFraction * PPM_SCALE);
  assertValidRate(accumulatedRatePpm);
  return accumulatedRatePpm;
}
