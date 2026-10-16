import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { ACCOUNT_TYPES, type AccountType, type AccountTypeStatus } from "./account-types";
import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";
import {
  applyAccountTypeOverrides,
  applyScoreOverrides,
  referenceRevisedSinceOverride,
} from "./overrides";
import { DEFAULT_COMPARISON_SETTINGS, compareBanks, type ScorableBankProfile } from "./scoring";
import type { WeightLevels } from "./weights";

function profile(
  institutionId: string,
  scores: Partial<Record<BankProfileCriterion, number | null>>,
  accountTypes: Partial<Record<AccountType, AccountTypeStatus>> = {},
): ScorableBankProfile {
  return {
    institutionId,
    criteria: Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => {
        const score = scores[criterion] ?? null;
        return [
          criterion,
          score === null
            ? { status: "insufficient-evidence", reviewedAt: "2026-09-09" }
            : { status: "scored", score, reviewedAt: "2026-09-09" },
        ];
      }),
    ) as ScorableBankProfile["criteria"],
    accountTypes: Object.fromEntries(
      ACCOUNT_TYPES.map((type) => [type, accountTypes[type] ?? "not-found"]),
    ) as ScorableBankProfile["accountTypes"],
  };
}

const nubank = profile("nubank", { fees: 100 }, { shared: "offered" });
const itau = profile("itau", { fees: 40 }, { joint: "offered" });

describe("applyScoreOverrides", () => {
  it("replaces the overridden criterion's score and keeps the reference review date", () => {
    const [overridden] = applyScoreOverrides(
      [nubank],
      [{ institutionId: "nubank", criterion: "security", score: 30 }],
    );
    expect(overridden?.criteria.security).toEqual({
      status: "scored",
      score: 30,
      reviewedAt: "2026-09-09",
    });
    expect(overridden?.criteria.fees).toBe(nubank.criteria.fees);
  });

  it("scores a criterion the reference marks as insufficient evidence", () => {
    const [overridden] = applyScoreOverrides(
      [nubank],
      [{ institutionId: "nubank", criterion: "security", score: 70 }],
    );
    expect(overridden?.criteria.security).toEqual({
      status: "scored",
      score: 70,
      reviewedAt: "2026-09-09",
    });
  });

  it("leaves other institutions untouched and ignores overrides for unknown ones", () => {
    const result = applyScoreOverrides(
      [nubank, itau],
      [
        { institutionId: "nubank", criterion: "fees", score: 10 },
        { institutionId: "gone", criterion: "fees", score: 10 },
      ],
    );
    expect(result).toHaveLength(2);
    expect(result[1]).toBe(itau);
  });

  it("changes the household's comparison", () => {
    const levels: WeightLevels = {
      ...Object.fromEntries(BANK_PROFILE_CRITERIA.map((criterion) => [criterion, 0])),
      fees: 5,
    } as WeightLevels;
    const before = compareBanks({
      profiles: [nubank, itau],
      levels,
      currentInstitutionIds: [],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });
    const after = compareBanks({
      profiles: applyScoreOverrides(
        [nubank, itau],
        [{ institutionId: "nubank", criterion: "fees", score: 10 }],
      ),
      levels,
      currentInstitutionIds: [],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });
    expect(before.reviewed[0]?.institutionId).toBe("nubank");
    expect(after.reviewed[0]?.institutionId).toBe("itau");
  });

  it("is the identity without overrides and pins every overridden score", () => {
    const scoreArb = fc.integer({ min: 0, max: 100 });
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            institutionId: fc.constantFrom("nubank", "itau"),
            criterion: fc.constantFrom(...BANK_PROFILE_CRITERIA),
            score: scoreArb,
          }),
          { maxLength: 6 },
        ),
        (overrides) => {
          expect(applyScoreOverrides([nubank, itau], [])).toEqual([nubank, itau]);
          const result = applyScoreOverrides([nubank, itau], overrides);
          const last = new Map<string, number>(
            overrides.map((o) => [`${o.institutionId}:${o.criterion}`, o.score] as const),
          );
          for (const bank of result) {
            for (const criterion of BANK_PROFILE_CRITERIA) {
              const pinned = last.get(`${bank.institutionId}:${criterion}`);
              const entry = bank.criteria[criterion];
              if (pinned !== undefined) {
                expect(entry).toMatchObject({ status: "scored", score: pinned });
              }
            }
          }
        },
      ),
    );
  });
});

describe("applyAccountTypeOverrides", () => {
  it("replaces the overridden account type's status", () => {
    const [overridden] = applyAccountTypeOverrides(
      [nubank],
      [{ institutionId: "nubank", accountType: "joint", offered: true }],
    );
    expect(overridden?.accountTypes.joint).toBe("offered");
    expect(overridden?.accountTypes.shared).toBe("offered");
  });

  it("records a not-offered call as not-offered, even over a reference offered", () => {
    const [overridden] = applyAccountTypeOverrides(
      [itau],
      [{ institutionId: "itau", accountType: "joint", offered: false }],
    );
    expect(overridden?.accountTypes.joint).toBe("not-offered");
  });

  it("leaves other institutions and other account types untouched", () => {
    const result = applyAccountTypeOverrides(
      [nubank, itau],
      [
        { institutionId: "nubank", accountType: "mei", offered: true },
        { institutionId: "gone", accountType: "mei", offered: true },
      ],
    );
    expect(result).toHaveLength(2);
    expect(result[1]).toBe(itau);
    expect(result[0]?.accountTypes.shared).toBe(nubank.accountTypes.shared);
  });

  it("changes the household's comparison against the account-type filter", () => {
    const levels: WeightLevels = Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, criterion === "fees" ? 1 : 0]),
    ) as WeightLevels;
    const settings = {
      ...DEFAULT_COMPARISON_SETTINGS,
      accountTypeFilter: {
        ...DEFAULT_COMPARISON_SETTINGS.accountTypeFilter,
        mei: "required" as const,
      },
    };
    const before = compareBanks({
      profiles: [nubank],
      levels,
      currentInstitutionIds: [],
      settings,
    });
    const after = compareBanks({
      profiles: applyAccountTypeOverrides(
        [nubank],
        [{ institutionId: "nubank", accountType: "mei", offered: true }],
      ),
      levels,
      currentInstitutionIds: [],
      settings,
    });
    expect(before.noneMeetsRequirements).toBe(true);
    expect(after.noneMeetsRequirements).toBe(false);
  });

  it("is the identity without overrides and pins every overridden status", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            institutionId: fc.constantFrom("nubank", "itau"),
            accountType: fc.constantFrom(...ACCOUNT_TYPES),
            offered: fc.boolean(),
          }),
          { maxLength: 6 },
        ),
        (overrides) => {
          expect(applyAccountTypeOverrides([nubank, itau], [])).toEqual([nubank, itau]);
          const result = applyAccountTypeOverrides([nubank, itau], overrides);
          const last = new Map<string, boolean>(
            overrides.map((o) => [`${o.institutionId}:${o.accountType}`, o.offered] as const),
          );
          for (const bank of result) {
            for (const type of ACCOUNT_TYPES) {
              const pinned = last.get(`${bank.institutionId}:${type}`);
              if (pinned !== undefined) {
                expect(bank.accountTypes[type]).toBe(pinned ? "offered" : "not-offered");
              }
            }
          }
        },
      ),
    );
  });
});

describe("referenceRevisedSinceOverride", () => {
  it("is true only when the reference was reviewed after the version the override was made on", () => {
    expect(referenceRevisedSinceOverride("2026-11-01", "2026-09-09")).toBe(true);
    expect(referenceRevisedSinceOverride("2026-09-09", "2026-09-09")).toBe(false);
    expect(referenceRevisedSinceOverride("2026-08-01", "2026-09-09")).toBe(false);
  });
});
