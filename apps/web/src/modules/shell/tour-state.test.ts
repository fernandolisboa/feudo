import { describe, expect, it } from "vitest";

import { markTourSeen, shouldAutoStart, type TourState } from "./tour-state";
import { TOURS } from "./tours";

const overview = TOURS.overview;

describe("shouldAutoStart", () => {
  it("starts a tour the user has never closed", () => {
    expect(shouldAutoStart(overview, { autoStart: true, seenVersions: {} })).toBe(true);
  });

  it("does not start a tour already closed at its current version", () => {
    const state: TourState = { autoStart: true, seenVersions: { overview: overview.version } };
    expect(shouldAutoStart(overview, state)).toBe(false);
  });

  it("starts again, once, when the tour's version was bumped after it was closed", () => {
    const bumped = { ...overview, version: overview.version + 1 };
    const state: TourState = { autoStart: true, seenVersions: { overview: overview.version } };

    expect(shouldAutoStart(bumped, state)).toBe(true);
    expect(shouldAutoStart(bumped, markTourSeen(state, bumped, false))).toBe(false);
  });

  it("never starts any tour when tutorials are turned off", () => {
    const state: TourState = { autoStart: false, seenVersions: {} };
    for (const tour of Object.values(TOURS)) {
      expect(shouldAutoStart(tour, state)).toBe(false);
    }
  });
});

describe("markTourSeen", () => {
  it("records the tour at its current version and keeps the other tours", () => {
    const state: TourState = { autoStart: true, seenVersions: { household: 1 } };

    expect(markTourSeen(state, overview, false)).toEqual({
      autoStart: true,
      seenVersions: { household: 1, overview: overview.version },
    });
  });

  it("turns auto-start off when asked to", () => {
    const state: TourState = { autoStart: true, seenVersions: {} };

    expect(markTourSeen(state, overview, true).autoStart).toBe(false);
  });
});
