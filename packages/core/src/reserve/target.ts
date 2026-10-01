import type { AverageFixedCost } from "../ledger/dashboard";
import { NonIntegerAmountError } from "../money/money";
import { MAX_RESERVE_MULTIPLE, MIN_RESERVE_MULTIPLE } from "./constants";

export type ReserveTarget = {
  targetCentavos: number;
  multiple: number;
  averageFixedCostCentavos: number;
  monthsUsedCount: number;
  isEstimate: boolean;
};

export class InvalidReserveMultipleError extends Error {
  readonly multiple: number;

  constructor(multiple: number) {
    super(
      `Reserve multiple must be an integer between ${String(MIN_RESERVE_MULTIPLE)} and ${String(MAX_RESERVE_MULTIPLE)}, received ${String(multiple)}`,
    );
    this.name = "InvalidReserveMultipleError";
    this.multiple = multiple;
  }
}

function assertValidMultiple(multiple: number): void {
  if (
    !Number.isInteger(multiple) ||
    multiple < MIN_RESERVE_MULTIPLE ||
    multiple > MAX_RESERVE_MULTIPLE
  ) {
    throw new InvalidReserveMultipleError(multiple);
  }
}

// Reserve target = reserve multiple × average fixed cost (CONTEXT.md),
// floored at zero: a household whose fixed-cost refunds exceeded its fixed
// debits in the window has a negative average, and a negative target has no
// meaning to hold against (shouldNotifyReserveTargetChange, notice.ts,
// compares against this same floored value). averageFixedCostCentavos still
// carries the raw, possibly negative average, since the tile that shows it
// is telling the household a fact, not a target.
export function computeReserveTarget(average: AverageFixedCost, multiple: number): ReserveTarget {
  assertValidMultiple(multiple);

  if (!Number.isInteger(average.averageCentavos)) {
    throw new NonIntegerAmountError(average.averageCentavos);
  }

  return {
    targetCentavos: Math.max(0, average.averageCentavos) * multiple,
    multiple,
    averageFixedCostCentavos: average.averageCentavos,
    monthsUsedCount: average.monthsUsed.length,
    isEstimate: average.isEstimate,
  };
}
