import type { TourDefinition, TourId } from "./tours";

export type TourState = {
  autoStart: boolean;
  seenVersions: Partial<Record<TourId, number>>;
};

export function shouldAutoStart(tour: TourDefinition, state: TourState): boolean {
  return state.autoStart && (state.seenVersions[tour.id] ?? 0) < tour.version;
}

export function markTourSeen(
  state: TourState,
  tour: TourDefinition,
  turnOffAutoStart: boolean,
): TourState {
  return {
    autoStart: turnOffAutoStart ? false : state.autoStart,
    seenVersions: { ...state.seenVersions, [tour.id]: tour.version },
  };
}
