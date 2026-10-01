import { RESERVE_TARGET_NOTICE_THRESHOLD_BASIS_POINTS } from "./constants";

export type ReserveTargetNoticeInput = {
  previousAverageFixedCostCentavos: number | null;
  currentMultiple: number;
  nextTargetCentavos: number;
};

// Rescales the previous recorded average to the household's *current*
// multiple before comparing (previousTarget = previousAverage × current
// multiple), so changing only the multiple, with the same average fixed
// cost, never crosses the threshold on its own (CONTEXT.md, "Reserve
// target"). Integer basis-point math only: strictly more than 10% notifies,
// exactly 10% does not. No previous record at all means no notice.
export function shouldNotifyReserveTargetChange(input: ReserveTargetNoticeInput): boolean {
  if (input.previousAverageFixedCostCentavos === null) {
    return false;
  }

  const rescaledPreviousTargetCentavos =
    input.previousAverageFixedCostCentavos * input.currentMultiple;
  const differenceCentavos = Math.abs(input.nextTargetCentavos - rescaledPreviousTargetCentavos);

  return (
    differenceCentavos * 10000 >
    rescaledPreviousTargetCentavos * RESERVE_TARGET_NOTICE_THRESHOLD_BASIS_POINTS
  );
}
