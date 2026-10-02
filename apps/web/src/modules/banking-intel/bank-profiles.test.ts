import { BANK_PROFILE_CRITERIA } from "@feudo/core";
import { INSTITUTIONS, isStale, type BankProfile } from "@feudo/core/reference-data";
import { describe, expect, it } from "vitest";

import { BANK_PROFILES, staleCriteria } from "./bank-profiles";

describe("bank profiles dataset", () => {
  it("loads one validated profile per institution, each with every criterion", () => {
    expect(BANK_PROFILES.map((profile) => profile.institutionId)).toEqual(
      INSTITUTIONS.map((institution) => institution.id),
    );
    for (const profile of BANK_PROFILES) {
      expect(Object.keys(profile.criteria)).toEqual([...BANK_PROFILE_CRITERIA]);
    }
  });

  it("scores only on the 0 to 100 integer scale", () => {
    for (const profile of BANK_PROFILES) {
      for (const entry of Object.values(profile.criteria)) {
        if (entry.status !== "scored") continue;
        expect(Number.isInteger(entry.score)).toBe(true);
        expect(entry.score).toBeGreaterThanOrEqual(0);
        expect(entry.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("lists criteria whose review is older than the threshold", () => {
    const profile = BANK_PROFILES[0] as BankProfile;
    expect(staleCriteria([profile], "2026-10-02")).toEqual([]);
    const stale = staleCriteria([profile], "2027-04-01");
    expect(stale.map((entry) => entry.criterion)).toContain("cardBenefits");
    expect(stale.every((entry) => entry.institutionId === profile.institutionId)).toBe(true);
  });

  it("reports stale reference data without failing", () => {
    const today = new Date().toISOString().slice(0, 10);
    const staleInstitutions = INSTITUTIONS.filter((institution) =>
      isStale(institution.reviewedAt, today),
    ).map((institution) => `institutions.${institution.id} (${institution.reviewedAt})`);
    const staleProfiles = staleCriteria(BANK_PROFILES, today).map(
      (entry) => `bank-profiles.${entry.institutionId}.${entry.criterion} (${entry.reviewedAt})`,
    );
    const stale = [...staleInstitutions, ...staleProfiles];
    if (stale.length > 0) {
      console.warn(`Stale reference data, review it: ${stale.join(", ")}`);
    }
    expect(stale.every((entry) => entry.length > 0)).toBe(true);
  });
});
