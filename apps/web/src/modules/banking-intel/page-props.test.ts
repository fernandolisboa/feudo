import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BANK_PROFILE_CRITERIA,
  DEFAULT_ACCOUNT_TYPE_FILTER,
  DEFAULT_COMPARISON_SETTINGS,
  DEFAULT_WEIGHT_LEVELS,
  type AccountTypeStatus,
  type BankProfileCriterion,
} from "@feudo/core";

const getHouseholdSettingsMock = vi.hoisted(() => vi.fn());
const getHouseholdCriteriaWeightsMock = vi.hoisted(() => vi.fn());
const getHouseholdInstitutionsMock = vi.hoisted(() => vi.fn());
const getHouseholdOverridesMock = vi.hoisted(() => vi.fn());
const getHouseholdAccountTypeOverridesMock = vi.hoisted(() => vi.fn());

vi.mock("@/platform/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/modules/households", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/households")>()),
  getHouseholdSettings: getHouseholdSettingsMock,
}));
vi.mock("./service", () => ({
  getHouseholdCriteriaWeights: getHouseholdCriteriaWeightsMock,
  getHouseholdInstitutions: getHouseholdInstitutionsMock,
  getHouseholdOverrides: getHouseholdOverridesMock,
  getHouseholdAccountTypeOverrides: getHouseholdAccountTypeOverridesMock,
}));

function scorableProfile(institutionId: string, jointStatus: AccountTypeStatus) {
  return {
    institutionId,
    criteria: Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [
        criterion,
        { status: "scored" as const, score: 60, reviewedAt: "2026-10-01" },
      ]),
    ) as Record<BankProfileCriterion, { status: "scored"; score: number; reviewedAt: string }>,
    accountTypes: {
      joint: jointStatus,
      shared: "not-offered" as AccountTypeStatus,
      jointInvestment: "not-offered" as AccountTypeStatus,
      mei: "not-offered" as AccountTypeStatus,
    },
  };
}

function fullProfile(institutionId: string, jointStatus: AccountTypeStatus) {
  const { accountTypes, ...rest } = scorableProfile(institutionId, jointStatus);
  return {
    ...rest,
    accountTypes: Object.fromEntries(
      Object.entries(accountTypes).map(([type, status]) => [
        type,
        { status, reviewedAt: "2026-10-01" },
      ]),
    ),
  };
}

const scorable = vi.hoisted(() => [] as ReturnType<typeof scorableProfile>[]);
const full = vi.hoisted(() => [] as ReturnType<typeof fullProfile>[]);

vi.mock("./bank-profiles", () => ({
  BANK_PROFILES: full,
  referenceProfileOf: (institutionId: string) =>
    full.find((profile) => profile.institutionId === institutionId),
  scorableProfiles: () => scorable,
}));
scorable.push(scorableProfile("bank-a", "offered"), scorableProfile("bank-b", "not-offered"));
full.push(fullProfile("bank-a", "offered"), fullProfile("bank-b", "not-offered"));

import { buildBanksPageProps } from "./page-props";
import { t } from "./strings";

function accountTypeOverride(institutionId: string, offered: boolean, baseReviewedAt: string) {
  return {
    institutionId,
    accountType: "joint" as const,
    offered,
    note: "Conta conjunta nova.",
    sourceUrl: null,
    baseReviewedAt,
    updatedAt: new Date("2026-10-14T12:00:00.000Z"),
  };
}

beforeEach(() => {
  getHouseholdSettingsMock.mockReset().mockResolvedValue(null);
  getHouseholdOverridesMock.mockReset().mockResolvedValue([]);
  getHouseholdAccountTypeOverridesMock.mockReset().mockResolvedValue([]);
  getHouseholdInstitutionsMock
    .mockReset()
    .mockResolvedValue({ hasAccounts: false, institutionIds: [], unrecognizedLabels: [] });
});

describe("buildBanksPageProps", () => {
  it("says no bank has the account types the household marked as required, with no candidates, when neither bank offers it", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: DEFAULT_WEIGHT_LEVELS,
      options: {
        ...DEFAULT_COMPARISON_SETTINGS,
        accountTypeFilter: { ...DEFAULT_ACCOUNT_TYPE_FILTER, mei: "required" },
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

  it("names a candidate when at least one bank meets the household's account-type filter", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: DEFAULT_WEIGHT_LEVELS,
      options: {
        ...DEFAULT_COMPARISON_SETTINGS,
        accountTypeFilter: {
          ...DEFAULT_ACCOUNT_TYPE_FILTER,
          jointBanking: "required",
          jointOnly: true,
        },
      },
      isCustom: true,
    });

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.headline).not.toBe(t.headline.noneMeetsRequirements);
    expect(props.candidates.map((candidate) => candidate.institutionId)).toEqual(["bank-a"]);
  });

  it("describes the filter in the summary sentence, counting the banks that meet it", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: DEFAULT_WEIGHT_LEVELS,
      options: {
        ...DEFAULT_COMPARISON_SETTINGS,
        accountTypeFilter: {
          ...DEFAULT_ACCOUNT_TYPE_FILTER,
          jointBanking: "required",
          jointOnly: true,
        },
      },
      isCustom: true,
    });

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.accountTypeFilterSummary).toBe(
      "Mostrando 1 de 2 bancos: os que têm conta conjunta.",
    );
  });

  it("says every bank is shown when the household sets no requirement", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: DEFAULT_WEIGHT_LEVELS,
      options: DEFAULT_COMPARISON_SETTINGS,
      isCustom: false,
    });

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.accountTypeFilterSummary).toBe("Mostrando todos os 2 bancos.");
  });

  it("scores with the household's account-type corrections, marks the corrected bank and links every bank to its page", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: DEFAULT_WEIGHT_LEVELS,
      options: {
        ...DEFAULT_COMPARISON_SETTINGS,
        accountTypeFilter: {
          ...DEFAULT_ACCOUNT_TYPE_FILTER,
          jointBanking: "required",
          jointOnly: true,
        },
      },
      isCustom: true,
    });
    getHouseholdAccountTypeOverridesMock.mockResolvedValue([
      accountTypeOverride("bank-b", true, "2026-10-01"),
    ]);

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.candidates.map((candidate) => candidate.institutionId)).toEqual(
      expect.arrayContaining(["bank-b"]),
    );
    expect(props.reviewed.find((row) => row.institutionId === "bank-b")?.overriddenLabel).toBe(
      "corrigido pela casa: Conta conjunta",
    );
    expect(props.reviewed.every((row) => row.href === `/bancos/${row.institutionId}`)).toBe(true);
    expect(props.overridesNotice).toBeNull();
  });

  it("tells the household when the reference was reviewed after one of its account-type corrections", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: DEFAULT_WEIGHT_LEVELS,
      options: DEFAULT_COMPARISON_SETTINGS,
      isCustom: false,
    });
    getHouseholdAccountTypeOverridesMock.mockResolvedValue([
      accountTypeOverride("bank-a", true, "2026-09-09"),
    ]);

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.overridesNotice).toBe(t.overridesNotice.one.replace("{banks}", "bank-a"));
  });

  it("shows what a bank offers next to the reviewed row", async () => {
    getHouseholdCriteriaWeightsMock.mockResolvedValue({
      levels: DEFAULT_WEIGHT_LEVELS,
      options: DEFAULT_COMPARISON_SETTINGS,
      isCustom: false,
    });

    const props = await buildBanksPageProps(
      { householdId: "household-1" },
      { now: new Date("2026-10-14T12:00:00.000Z"), canManage: true },
    );

    expect(props.reviewed.find((row) => row.institutionId === "bank-a")?.offeredTypesLine).toBe(
      "conjunta",
    );
    expect(
      props.reviewed.find((row) => row.institutionId === "bank-b")?.offeredTypesLine,
    ).toBeNull();
  });
});
