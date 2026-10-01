export const MIN_RESERVE_MULTIPLE = 3;
export const MAX_RESERVE_MULTIPLE = 12;
export const DEFAULT_RESERVE_MULTIPLE = 6;

// 10% in basis points (10000 = 100%): a household is notified of a new
// reserve target only when it moves by strictly more than this many basis
// points from the previous recorded one (CONTEXT.md, "Reserve target").
export const RESERVE_TARGET_NOTICE_THRESHOLD_BASIS_POINTS = 1000;
