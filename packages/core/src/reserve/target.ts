import type { AverageFixedCost } from "../ledger/dashboard";
import { NonIntegerAmountError } from "../money/money";
import { MAX_RESERVE_MULTIPLE, MIN_RESERVE_MULTIPLE } from "./constants";

export type ReserveTarget = {
  targetCentavos: number;
  multiple: number;
  averageFixedCostCentavos: number;
  monthsUsed: number;
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

// Reserve target = reserve multiple × average fixed cost (CONTEXT.md). With
// no average yet (no categorized month in the window at all), the target is
// zero rather than undefined, so a caller can still show "0 months of
// history" instead of branching on null everywhere; isEstimate stays true,
// since zero history is the extreme case of "fewer than the minimum months".
export function computeReserveTarget(
  average: AverageFixedCost | null,
  multiple: number,
): ReserveTarget {
  assertValidMultiple(multiple);

  if (average === null) {
    return {
      targetCentavos: 0,
      multiple,
      averageFixedCostCentavos: 0,
      monthsUsed: 0,
      isEstimate: true,
    };
  }

  if (!Number.isInteger(average.averageCentavos)) {
    throw new NonIntegerAmountError(average.averageCentavos);
  }

  return {
    targetCentavos: average.averageCentavos * multiple,
    multiple,
    averageFixedCostCentavos: average.averageCentavos,
    monthsUsed: average.monthsUsed.length,
    isEstimate: average.isEstimate,
  };
}
