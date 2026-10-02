import { describe, expect, it } from "vitest";

import { BANK_PROFILE_CRITERIA, BANK_PROFILE_SCORE_MAX, BANK_PROFILE_SCORE_MIN } from "./criteria";

describe("bank profile criteria", () => {
  it("lists the seven criteria of ADR-0006 once each", () => {
    expect(new Set(BANK_PROFILE_CRITERIA).size).toBe(7);
  });

  it("scores from 0 to 100", () => {
    expect([BANK_PROFILE_SCORE_MIN, BANK_PROFILE_SCORE_MAX]).toEqual([0, 100]);
  });
});
