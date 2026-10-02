import { describe, expect, it } from "vitest";

import {
  REFERENCE_DATA_STALE_AFTER_DAYS,
  citationSchema,
  daysSinceReview,
  isStale,
} from "./review";

describe("daysSinceReview", () => {
  it("counts whole days between the review date and today", () => {
    expect(daysSinceReview("2026-09-09", "2026-10-02")).toBe(23);
    expect(daysSinceReview("2026-10-02", "2026-10-02")).toBe(0);
  });
});

describe("isStale", () => {
  it("is fresh up to and including the threshold and stale one day after", () => {
    expect(REFERENCE_DATA_STALE_AFTER_DAYS).toBe(180);
    expect(isStale("2026-01-01", "2026-06-30")).toBe(false);
    expect(isStale("2026-01-01", "2026-07-01")).toBe(true);
  });
});

describe("citationSchema", () => {
  const citation = {
    url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
    kind: "primary",
    checkedAt: "2026-10-02",
    finding: "ISPB 00416968, code 077.",
  };

  it("accepts an https source with a dated finding", () => {
    expect(citationSchema.parse(citation)).toEqual(citation);
  });

  it("rejects a plain-http source, a blank finding and an invalid date", () => {
    expect(citationSchema.safeParse({ ...citation, url: "http://example.com" }).success).toBe(
      false,
    );
    expect(citationSchema.safeParse({ ...citation, finding: "  " }).success).toBe(false);
    expect(citationSchema.safeParse({ ...citation, checkedAt: "2026-02-30" }).success).toBe(false);
  });
});
