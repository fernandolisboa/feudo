import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { MAX_RESERVE_MULTIPLE, MIN_RESERVE_MULTIPLE } from "./constants";
import { shouldNotifyReserveTargetChange } from "./notice";

const multipleArb = fc.integer({ min: MIN_RESERVE_MULTIPLE, max: MAX_RESERVE_MULTIPLE });
const averageArb = fc.integer({ min: 0, max: 1_000_000_00 });

describe("shouldNotifyReserveTargetChange property tests", () => {
  it("never notifies for a multiple change alone, whatever the previous average was", () => {
    fc.assert(
      fc.property(averageArb, multipleArb, (previousAverage, newMultiple) => {
        const rescaledTarget = previousAverage * newMultiple;
        expect(
          shouldNotifyReserveTargetChange({
            previousAverageFixedCostCentavos: previousAverage,
            currentMultiple: newMultiple,
            nextTargetCentavos: rescaledTarget,
          }),
        ).toBe(false);
      }),
    );
  });

  it("never notifies with no previous record, whatever the next target is", () => {
    fc.assert(
      fc.property(multipleArb, fc.integer({ min: 0, max: 1_000_000_00 }), (multiple, next) => {
        expect(
          shouldNotifyReserveTargetChange({
            previousAverageFixedCostCentavos: null,
            currentMultiple: multiple,
            nextTargetCentavos: next,
          }),
        ).toBe(false);
      }),
    );
  });
});
