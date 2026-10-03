import { describe, expect, it } from "vitest";

import { hasAcceptedCurrentTerms, TERMS_VERSION } from "./terms";

describe("hasAcceptedCurrentTerms", () => {
  it("is true only for the version this deploy publishes", () => {
    expect(hasAcceptedCurrentTerms({ termsVersion: TERMS_VERSION })).toBe(true);
    expect(hasAcceptedCurrentTerms({ termsVersion: "2026-09-09" })).toBe(false);
  });
});
