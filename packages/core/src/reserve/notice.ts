import { RESERVE_TARGET_NOTICE_THRESHOLD_BASIS_POINTS } from "./constants";

export type ReserveTargetNoticeInput = {
  previousAverageFixedCostCentavos: number | null;
  currentMultiple: number;
  nextTargetCentavos: number;
};

export type ReserveTargetNoticeResult = {
  notify: boolean;
  previousTargetCentavos: number;
};

// Rescales the previous recorded average to the household's *current*
// multiple before comparing (previousTarget = previousAverage × current
// multiple), so changing only the multiple, with the same average fixed
// cost, never crosses the threshold on its own (CONTEXT.md, "Reserve
// target"). Floored at zero first, the same way computeReserveTarget floors
// the live target (target.ts): a negative previous average would otherwise
// make every later month's non-negative target look like a swing of more
// than 10%, notifying forever. Integer basis-point math only: strictly more
// than 10% notifies, exactly 10% does not. No previous record at all means
// no notice. previousTargetCentavos is always returned (0 with no previous
// record) so the caller persists the exact, already-floored value this
// function compared, instead of rescaling the raw average a second time.
export function shouldNotifyReserveTargetChange(
  input: ReserveTargetNoticeInput,
): ReserveTargetNoticeResult {
  if (input.previousAverageFixedCostCentavos === null) {
    return { notify: false, previousTargetCentavos: 0 };
  }

  const previousTargetCentavos =
    Math.max(0, input.previousAverageFixedCostCentavos) * input.currentMultiple;
  const differenceCentavos = Math.abs(input.nextTargetCentavos - previousTargetCentavos);

  const notify =
    differenceCentavos * 10000 >
    previousTargetCentavos * RESERVE_TARGET_NOTICE_THRESHOLD_BASIS_POINTS;

  return { notify, previousTargetCentavos };
}
