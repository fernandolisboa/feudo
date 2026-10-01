import { describe, expect, it } from "vitest";

import { shouldNotifyReserveTargetChange } from "./notice";

describe("shouldNotifyReserveTargetChange", () => {
  it("does not notify with no previous record", () => {
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: null,
        currentMultiple: 6,
        nextTargetCentavos: 600000,
      }),
    ).toEqual({ notify: false, previousTargetCentavos: 0 });
  });

  it("notifies when the rescaled previous target moves by strictly more than 10%", () => {
    // previous average 100000 rescaled to the current multiple (6) = 600000;
    // next target 660001 is just over 10% above that.
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: 100000,
        currentMultiple: 6,
        nextTargetCentavos: 660001,
      }),
    ).toEqual({ notify: true, previousTargetCentavos: 600000 });
  });

  it("does not notify at exactly 10%", () => {
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: 100000,
        currentMultiple: 6,
        nextTargetCentavos: 660000,
      }).notify,
    ).toBe(false);
  });

  it("does not notify just below 10%", () => {
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: 100000,
        currentMultiple: 6,
        nextTargetCentavos: 659999,
      }).notify,
    ).toBe(false);
  });

  it("does not notify on a decrease at exactly 10%", () => {
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: 100000,
        currentMultiple: 6,
        nextTargetCentavos: 540000,
      }).notify,
    ).toBe(false);
  });

  it("notifies on a decrease strictly more than 10%", () => {
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: 100000,
        currentMultiple: 6,
        nextTargetCentavos: 539999,
      }).notify,
    ).toBe(true);
  });

  it("a multiple change alone never notifies: rescales the previous average to the new multiple first", () => {
    // Previous average 100000 at multiple 6 => previous target was 600000.
    // The household changes its multiple to 9; the new target is exactly
    // the rescaled previous target (100000 * 9), so nothing moved.
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: 100000,
        currentMultiple: 9,
        nextTargetCentavos: 900000,
      }).notify,
    ).toBe(false);
  });

  it("notifies when the previous average was zero and the next target is positive", () => {
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: 0,
        currentMultiple: 6,
        nextTargetCentavos: 1,
      }).notify,
    ).toBe(true);
  });

  it("does not notify when both the previous and the next are zero", () => {
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: 0,
        currentMultiple: 6,
        nextTargetCentavos: 0,
      }).notify,
    ).toBe(false);
  });

  it("floors a negative previous average at zero, so an unchanged floored target never notifies", () => {
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: -50000,
        currentMultiple: 6,
        nextTargetCentavos: 0,
      }),
    ).toEqual({ notify: false, previousTargetCentavos: 0 });
  });

  it("flooring a negative previous average still notifies on a real move away from zero", () => {
    expect(
      shouldNotifyReserveTargetChange({
        previousAverageFixedCostCentavos: -50000,
        currentMultiple: 6,
        nextTargetCentavos: 600000,
      }).notify,
    ).toBe(true);
  });
});
