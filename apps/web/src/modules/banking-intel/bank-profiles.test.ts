import { BANK_PROFILE_CRITERIA, INSTITUTIONS, isStale } from "@feudo/core";
import { describe, expect, it } from "vitest";

import { BANK_PROFILES_DATASET } from "./bank-profiles-data";
import { parseBankProfilesDataset, type BankProfile } from "./bank-profile";
import { BANK_PROFILES, staleCriteria } from "./bank-profiles";

type MutableDataset = {
  version: number;
  profiles: { institutionId: string; criteria: Record<string, Record<string, unknown>> }[];
};

function cloneDataset(): MutableDataset {
  return structuredClone(BANK_PROFILES_DATASET);
}

function firstProfile(dataset: MutableDataset) {
  const profile = dataset.profiles[0];
  if (!profile) throw new Error("dataset has no profiles");
  return profile;
}

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

  it("fails when a scored criterion has no citation", () => {
    const dataset = cloneDataset();
    const profile = firstProfile(dataset);
    profile.criteria.fees = { ...profile.criteria.fees, citations: [] };
    expect(() => parseBankProfilesDataset(dataset)).toThrow();
  });

  it("fails on a score outside 0 to 100 or with decimals", () => {
    for (const score of [101, -1, 72.5]) {
      const dataset = cloneDataset();
      const profile = firstProfile(dataset);
      profile.criteria.fees = { ...profile.criteria.fees, score };
      expect(() => parseBankProfilesDataset(dataset), String(score)).toThrow();
    }
  });

  it("fails when a criterion is missing or unknown", () => {
    const missing = cloneDataset();
    delete firstProfile(missing).criteria.fees;
    expect(() => parseBankProfilesDataset(missing)).toThrow();

    const extra = cloneDataset();
    const profile = firstProfile(extra);
    profile.criteria.vibes = profile.criteria.fees ?? {};
    expect(() => parseBankProfilesDataset(extra)).toThrow();
  });

  it("fails on an unknown, duplicate or missing institution", () => {
    const unknown = cloneDataset();
    firstProfile(unknown).institutionId = "banco-imaginario";
    expect(() => parseBankProfilesDataset(unknown)).toThrow(
      /unknown institution .*banco-imaginario/,
    );

    const duplicate = cloneDataset();
    duplicate.profiles.push(firstProfile(duplicate));
    expect(() => parseBankProfilesDataset(duplicate)).toThrow(/duplicate profile .*nubank/);

    const missing = cloneDataset();
    missing.profiles.pop();
    expect(() => parseBankProfilesDataset(missing)).toThrow(/mercado-pago.* has no profile/);
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
    expect(stale.length).toBeGreaterThanOrEqual(0);
  });
});
