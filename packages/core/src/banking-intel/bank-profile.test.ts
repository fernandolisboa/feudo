import { describe, expect, it } from "vitest";

import { INSTITUTIONS } from "../institutions/institutions";

import { parseBankProfilesDataset } from "./bank-profile";
import { BANK_PROFILE_CRITERIA } from "./criteria";

const citation = {
  url: "https://www.bcb.gov.br/fis/tarifas/htms/00416968.asp",
  kind: "primary",
  checkedAt: "2026-10-02",
  finding: "Tariff registry entry.",
};

function scored(score: unknown) {
  return {
    status: "scored",
    score,
    evidence: "Evidence.",
    citations: [citation],
    reviewedAt: "2026-10-02",
  };
}

function profile(institutionId: string) {
  return {
    institutionId,
    criteria: Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, scored(60)]),
    ) as Record<string, Record<string, unknown>>,
  };
}

function dataset() {
  return { version: 1, profiles: INSTITUTIONS.map((institution) => profile(institution.id)) };
}

function first(raw: ReturnType<typeof dataset>) {
  const entry = raw.profiles[0];
  if (!entry) throw new Error("fixture has no profiles");
  return entry;
}

describe("parseBankProfilesDataset", () => {
  it("accepts one profile per institution with every criterion", () => {
    expect(parseBankProfilesDataset(dataset())).toHaveLength(INSTITUTIONS.length);
  });

  it("accepts a criterion marked as insufficient evidence without citations", () => {
    const raw = dataset();
    first(raw).criteria.security = {
      status: "insufficient-evidence",
      reason: "No citable source.",
      reviewedAt: "2026-10-02",
    };
    expect(parseBankProfilesDataset(raw)[0]?.criteria.security.status).toBe(
      "insufficient-evidence",
    );
  });

  it("fails when a scored criterion has no citation", () => {
    const raw = dataset();
    first(raw).criteria.fees = { ...scored(60), citations: [] };
    expect(() => parseBankProfilesDataset(raw)).toThrow();
  });

  it("fails when a criterion's review date predates its evidence or lists empty citations", () => {
    const early = dataset();
    first(early).criteria.fees = { ...scored(60), reviewedAt: "2026-09-09" };
    expect(() => parseBankProfilesDataset(early)).toThrow(/earlier than a citation/);

    const empty = dataset();
    first(empty).criteria.security = {
      status: "insufficient-evidence",
      reason: "No citable source.",
      citations: [],
      reviewedAt: "2026-10-02",
    };
    expect(() => parseBankProfilesDataset(empty)).toThrow();
  });

  it("fails on a score outside 0 to 100 or with decimals", () => {
    for (const score of [101, -1, 72.5]) {
      const raw = dataset();
      first(raw).criteria.fees = scored(score);
      expect(() => parseBankProfilesDataset(raw), String(score)).toThrow();
    }
  });

  it("fails when a criterion is missing or unknown", () => {
    const missing = dataset();
    delete first(missing).criteria.fees;
    expect(() => parseBankProfilesDataset(missing)).toThrow();

    const extra = dataset();
    first(extra).criteria.vibes = scored(60);
    expect(() => parseBankProfilesDataset(extra)).toThrow();
  });

  it("fails on an unknown, duplicate or missing institution", () => {
    const unknown = dataset();
    first(unknown).institutionId = "banco-imaginario";
    expect(() => parseBankProfilesDataset(unknown)).toThrow(
      /unknown institution .*banco-imaginario/,
    );

    const duplicate = dataset();
    duplicate.profiles.push(first(duplicate));
    expect(() => parseBankProfilesDataset(duplicate)).toThrow(/duplicate profile .*nubank/);

    const missing = dataset();
    missing.profiles.pop();
    expect(() => parseBankProfilesDataset(missing)).toThrow(/mercado-pago.* has no profile/);
  });
});
