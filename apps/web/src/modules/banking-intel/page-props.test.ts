import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BANK_PROFILE_CRITERIA,
  DEFAULT_COMPARISON_SETTINGS,
  DEFAULT_WEIGHT_LEVELS,
  type BankProfileCriterion,
} from "@feudo/core";

const getHouseholdSettingsMock = vi.hoisted(() => vi.fn());
const getHouseholdCriteriaWeightsMock = vi.hoisted(() => vi.fn());
const getHouseholdInstitutionsMock = vi.hoisted(() => vi.fn());
const getHouseholdOverridesMock = vi.hoisted(() => vi.fn());

vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/households")>()),
  getHouseholdSettings: getHouseholdSettingsMock,
}));
vi.mock("./service", () => ({
  getHouseholdCriteriaWeights: getHouseholdCriteriaWeightsMock,
  getHouseholdInstitutions: getHouseholdInstitutionsMock,
  getHouseholdOverrides: getHouseholdOverridesMock,
}));

function scoredProfile(institutionId: string, jointBankingScore: number) {
  return {
    institutionId,
    criteria: Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [
        criterion,
        {
          status: "scored" as const,
          score: criterion === "jointBanking" ? jointBankingScore : 60,
          reviewedAt: "2026-10-01",
        },
      ]),
    ) as Record<BankProfileCriterion, { status: "scored"; score: number; reviewedAt: string }>,
  };
}

const profiles = vi.hoisted(() => [] as ReturnType<typeof scoredProfile>[]);

vi.mock("./bank-profiles", () => ({
  BANK_PROFILES: profiles,
  referenceProfileOf: (institutionId: string) =>
    profiles.find((profile) => profile.institutionId === institutionId),
}));
profiles.push(scoredProfile("bank-a", 65), scoredProfile("bank-b", 30));

import { buildBanksPageProps } from "./page-props";
import { t } from "./strings";

function override(institutionId: string, score: number, baseReviewedAt: string) {
  return {
    institutionId,
    criterion: "jointBanking" as const,
    score,
    note: "Conta conjunta nova.",
    sourceUrl: null,
    baseReviewedAt,
    updatedAt: new Date("2026-10-14T12:00:00.000Z"),
  };
}

beforeEach(() => {
  getHouseholdSettingsMock.mockReset().mockResolvedValue(null);
  getHouseholdOverridesMock.mockReset().mockResolvedValue([]);
  getHouseholdInstitutionsMock
    .mockReset()
    .mockResolvedValue({ hasAccounts: false, institutionIds: [], unrecognizedLabels: [] });
});

describe("buildBanksPageProps", () => {
  it("says no bank meets the household's required criteria, with no candidates, when a required minimum is above every bank's score", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: { ...DEFAULT_WEIGHT_LEVELS, jointBanking: "required" },
      options: {
        ...DEFAULT_COMPARISON_SETTINGS,
        minimumScores: { ...DEFAULT_COMPARISON_SETTINGS.minimumScores, jointBanking: 100 },
      },
      isCustom: true,
    });

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.headline).toBe(t.headline.noneMeetsRequirements);
    expect(props.candidates).toEqual([]);
  });

  it("names a candidate when at least one bank meets the household's requirements", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: { ...DEFAULT_WEIGHT_LEVELS, jointBanking: "required" },
      options: {
        ...DEFAULT_COMPARISON_SETTINGS,
        minimumScores: { ...DEFAULT_COMPARISON_SETTINGS.minimumScores, jointBanking: 65 },
      },
      isCustom: true,
    });

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.headline).not.toBe(t.headline.noneMeetsRequirements);
    expect(props.candidates.length).toBeGreaterThan(0);
  });

  it("scores with the household's corrections, marks the corrected bank and links every bank to its page", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: { ...DEFAULT_WEIGHT_LEVELS, jointBanking: "required" },
      options: {
        ...DEFAULT_COMPARISON_SETTINGS,
        minimumScores: { ...DEFAULT_COMPARISON_SETTINGS.minimumScores, jointBanking: 100 },
      },
      isCustom: true,
    });
    getHouseholdOverridesMock.mockResolvedValue([override("bank-b", 100, "2026-10-01")]);

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.candidates.map((candidate) => candidate.institutionId)).toEqual(["bank-b"]);
    expect(props.candidates[0]?.href).toBe("/bancos/bank-b");
    expect(props.reviewed.map((row) => [row.institutionId, row.href, row.overriddenLabel])).toEqual(
      [
        ["bank-b", "/bancos/bank-b", "corrigido pela casa: Dinheiro a dois"],
        ["bank-a", "/bancos/bank-a", null],
      ],
    );
    expect(props.overridesNotice).toBeNull();
  });

  it("tells the household when the reference was reviewed after one of its corrections", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: DEFAULT_WEIGHT_LEVELS,
      options: DEFAULT_COMPARISON_SETTINGS,
      isCustom: false,
    });
    getHouseholdOverridesMock.mockResolvedValue([
      override("bank-a", 100, "2026-09-09"),
      override("bank-b", 100, "2026-10-01"),
    ]);

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.overridesNotice).toBe(t.overridesNotice.one.replace("{banks}", "bank-a"));
  });
});
