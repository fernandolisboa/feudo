import { describe, expect, it } from "vitest";

import { ACCOUNT_TYPES, type AccountType, type AccountTypeStatus } from "./account-types";
import type { BankProfileCriterion } from "./criteria";
import {
  compareBanks,
  DEFAULT_CANDIDATE_COUNT,
  DEFAULT_COMPARISON_SETTINGS,
  rankBankProfiles,
  resolveComparisonSettings,
  type ComparisonSettings,
  type ScorableBankProfile,
  type ScorableCriterionEntry,
} from "./scoring";
import { InvalidCriteriaWeightsError, type CriteriaWeights, type WeightLevels } from "./weights";

const REVIEWED = "2026-09-09";

function entry(score: number | null, reviewedAt = REVIEWED): ScorableCriterionEntry {
  return score === null
    ? { status: "insufficient-evidence", reviewedAt }
    : { status: "scored", score, reviewedAt };
}

type Scores = Record<BankProfileCriterion, number | null>;

function profile(
  institutionId: string,
  scores: Scores,
  accountTypes: Partial<Record<AccountType, AccountTypeStatus>> = {},
  reviewedAt = REVIEWED,
): ScorableBankProfile {
  return {
    institutionId,
    criteria: {
      cardBenefits: entry(scores.cardBenefits, reviewedAt),
      investmentAccess: entry(scores.investmentAccess, reviewedAt),
      appQuality: entry(scores.appQuality, reviewedAt),
      security: entry(scores.security, reviewedAt),
      fees: entry(scores.fees, reviewedAt),
      lockIn: entry(scores.lockIn, reviewedAt),
      publicReviews: entry(scores.publicReviews, reviewedAt),
    },
    accountTypes: Object.fromEntries(
      ACCOUNT_TYPES.map((type) => [type, accountTypes[type] ?? "not-found"]),
    ) as ScorableBankProfile["accountTypes"],
  };
}

const BASE_WEIGHTS: CriteriaWeights = {
  cardBenefits: 2,
  investmentAccess: 3,
  appQuality: 3,
  security: 4,
  fees: 5,
  lockIn: 4,
  publicReviews: 4,
};

const BASE_LEVELS: WeightLevels = BASE_WEIGHTS;

const NUBANK = profile(
  "nubank",
  {
    cardBenefits: 60,
    investmentAccess: 80,
    appQuality: 80,
    security: 60,
    fees: 100,
    lockIn: 60,
    publicReviews: 87,
  },
  { shared: "offered" },
);
const INTER = profile("inter", {
  cardBenefits: 60,
  investmentAccess: 80,
  appQuality: 60,
  security: 40,
  fees: 80,
  lockIn: 60,
  publicReviews: 85,
});
const ITAU = profile(
  "itau",
  {
    cardBenefits: 80,
    investmentAccess: 80,
    appQuality: null,
    security: null,
    fees: 40,
    lockIn: 40,
    publicReviews: 81,
  },
  { joint: "offered" },
);
const C6 = profile(
  "c6",
  {
    cardBenefits: 80,
    investmentAccess: 60,
    appQuality: null,
    security: 80,
    fees: 80,
    lockIn: 60,
    publicReviews: 72,
  },
  { shared: "offered" },
);
const BTG = profile(
  "btg",
  {
    cardBenefits: 60,
    investmentAccess: 100,
    appQuality: null,
    security: null,
    fees: 100,
    lockIn: 40,
    publicReviews: 74,
  },
  { shared: "offered" },
);
const SANTANDER = profile(
  "santander",
  {
    cardBenefits: null,
    investmentAccess: 80,
    appQuality: 40,
    security: null,
    fees: 40,
    lockIn: 20,
    publicReviews: 57,
  },
  { joint: "offered", mei: "offered" },
);

const PROFILES = [NUBANK, INTER, ITAU, C6, BTG, SANTANDER];

const ONLY_FEES: CriteriaWeights = {
  cardBenefits: 0,
  investmentAccess: 0,
  appQuality: 0,
  security: 0,
  fees: 1,
  lockIn: 0,
  publicReviews: 0,
};
const ONLY_FEES_LEVELS: WeightLevels = ONLY_FEES;

describe("rankBankProfiles", () => {
  it("scores each profile as the weighted mean of its evidenced criteria, rounded half up", () => {
    const [first] = rankBankProfiles([ITAU], BASE_WEIGHTS);

    // (2·80 + 3·80 + 5·40 + 4·40 + 4·81) / (2 + 3 + 5 + 4 + 4) = 1084 / 18 = 60.2
    expect(first?.score).toBe(60);
    expect(first?.missingEvidence).toEqual(["appQuality", "security"]);
    expect(first?.unmetRequirements).toEqual([]);
  });

  it("ranks by the exact weighted mean, not the rounded one", () => {
    const a = profile("a", { ...nulls(), fees: 61, lockIn: 60 });
    const b = profile("b", { ...nulls(), fees: 60, lockIn: 62 });
    const weights = { ...ONLY_FEES, fees: 3, lockIn: 2 };

    const ranked = rankBankProfiles([a, b], weights);

    // a = 303 / 5 = 60.6 and b = 304 / 5 = 60.8: both round to 61.
    expect(ranked.map((score) => [score.institutionId, score.score])).toEqual([
      ["b", 61],
      ["a", 61],
    ]);
  });

  it("orders the shipped profiles under the base weights", () => {
    expect(rankBankProfiles(PROFILES, BASE_WEIGHTS).map((score) => score.institutionId)).toEqual([
      "nubank",
      "btg",
      "c6",
      "inter",
      "itau",
      "santander",
    ]);
  });

  it("drops a zero-weight criterion from the score", () => {
    const [nubank] = rankBankProfiles([NUBANK], ONLY_FEES);

    expect(nubank?.score).toBe(100);
  });

  it("gives no score, ranked last, to a profile with no evidence on any weighted criterion", () => {
    const ranked = rankBankProfiles([profile("blank", nulls()), INTER], ONLY_FEES);

    expect(ranked.map((score) => [score.institutionId, score.score])).toEqual([
      ["inter", 80],
      ["blank", null],
    ]);
    expect(ranked[1]?.missingEvidence).toEqual(["fees"]);
  });

  it("keeps the input order between equal scores", () => {
    const ranked = rankBankProfiles([BTG, NUBANK], ONLY_FEES);

    expect(ranked.map((score) => score.institutionId)).toEqual(["btg", "nubank"]);
  });

  it("dates a profile by its oldest criterion review", () => {
    const mixed: ScorableBankProfile = {
      ...NUBANK,
      criteria: { ...NUBANK.criteria, lockIn: entry(60, "2026-03-01") },
    };

    expect(rankBankProfiles([mixed], BASE_WEIGHTS)[0]?.reviewedAt).toBe("2026-03-01");
  });

  it("refuses weights that leave nothing to weigh", () => {
    expect(() => rankBankProfiles(PROFILES, { ...ONLY_FEES, fees: 0 })).toThrow(
      InvalidCriteriaWeightsError,
    );
  });

  it("never gates: rankBankProfiles applies no account-type filter", () => {
    const ranked = rankBankProfiles(PROFILES, BASE_WEIGHTS);

    expect(ranked.every((score) => score.unmetRequirements.length === 0)).toBe(true);
  });
});

describe("compareBanks", () => {
  it(`offers the top ${String(DEFAULT_CANDIDATE_COUNT)} institutions the household does not use`, () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      levels: BASE_LEVELS,
      currentInstitutionIds: ["itau", "inter"],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });

    expect(comparison.baseline).toBe("current");
    expect(comparison.current.map((score) => score.institutionId)).toEqual(["inter", "itau"]);
    expect(comparison.candidates.map((candidate) => candidate.institutionId)).toEqual([
      "nubank",
      "btg",
      "c6",
    ]);
    expect(comparison.noneMeetsRequirements).toBe(false);
  });

  it("scores every profiled institution, the household's own and the candidates alike", () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      levels: BASE_LEVELS,
      currentInstitutionIds: ["itau", "inter"],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });

    expect(comparison.reviewed).toHaveLength(PROFILES.length);
    expect(new Set(comparison.reviewed.map((score) => score.institutionId))).toEqual(
      new Set(PROFILES.map((profile) => profile.institutionId)),
    );
  });

  it("sets each candidate against the best score the household already has on every weighted criterion", () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      levels: BASE_LEVELS,
      currentInstitutionIds: ["itau", "inter"],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });
    const c6 = comparison.candidates.find((candidate) => candidate.institutionId === "c6");

    expect(c6?.pros).toEqual([
      {
        criterion: "security",
        candidateScore: 80,
        baselineScore: 40,
        baselineInstitutionId: "inter",
        difference: 40,
      },
    ]);
    expect(c6?.cons).toEqual([
      {
        criterion: "investmentAccess",
        candidateScore: 60,
        baselineScore: 80,
        baselineInstitutionId: "inter",
        difference: -20,
      },
      {
        criterion: "publicReviews",
        candidateScore: 72,
        baselineScore: 85,
        baselineInstitutionId: "inter",
        difference: -13,
      },
    ]);
  });

  it("orders pros by weight times gap, largest first", () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      levels: BASE_LEVELS,
      currentInstitutionIds: ["santander"],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });
    const nubank = comparison.candidates.find((candidate) => candidate.institutionId === "nubank");

    expect(nubank?.pros.map((pro) => pro.criterion)).toEqual([
      "fees",
      "lockIn",
      "appQuality",
      "publicReviews",
    ]);
  });

  it("leaves out of pros and cons a criterion with zero weight or no evidence on either side", () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      levels: { ...BASE_LEVELS, lockIn: 0 },
      currentInstitutionIds: ["itau"],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });
    const listed = comparison.candidates.flatMap((candidate) =>
      [...candidate.pros, ...candidate.cons].map((item) => item.criterion),
    );

    expect(listed).not.toContain("lockIn");
    expect(listed).not.toContain("appQuality");
    expect(listed).not.toContain("security");
  });

  it("ignores differences smaller than the threshold", () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      levels: BASE_LEVELS,
      currentInstitutionIds: ["nubank"],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });
    const inter = comparison.candidates.find((candidate) => candidate.institutionId === "inter");

    expect(inter?.pros).toEqual([]);
    expect(inter?.cons.map((con) => con.criterion)).toEqual(["fees", "security", "appQuality"]);
    const btg = comparison.candidates.find((candidate) => candidate.institutionId === "btg");
    expect(btg?.cons.map((con) => con.criterion)).toEqual(["lockIn", "publicReviews"]);
  });

  it("compares against the median bank when the household uses none of the profiled institutions", () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      levels: ONLY_FEES_LEVELS,
      currentInstitutionIds: ["unknown-bank"],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });

    expect(comparison.baseline).toBe("median");
    expect(comparison.current).toEqual([]);
    expect(comparison.candidates[0]?.pros).toEqual([
      {
        criterion: "fees",
        candidateScore: 100,
        baselineScore: 80,
        baselineInstitutionId: null,
        difference: 20,
      },
    ]);
  });

  it("never offers an institution without a score", () => {
    const comparison = compareBanks({
      profiles: [profile("blank", nulls()), NUBANK],
      levels: ONLY_FEES_LEVELS,
      currentInstitutionIds: [],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });

    expect(comparison.candidates.map((candidate) => candidate.institutionId)).toEqual(["nubank"]);
  });

  it("has no baseline for a criterion none of the household's institutions has evidence on", () => {
    const comparison = compareBanks({
      profiles: [ITAU, C6],
      levels: { ...ONLY_FEES_LEVELS, fees: 0, security: 1 },
      currentInstitutionIds: ["itau"],
      settings: DEFAULT_COMPARISON_SETTINGS,
    });

    expect(comparison.candidates[0]?.pros).toEqual([]);
    expect(comparison.candidates[0]?.cons).toEqual([]);
  });

  describe("the account-type requirement gate (ADR-0006 amendment 2026-10-16)", () => {
    const JOINT_REQUIRED: ComparisonSettings = {
      ...DEFAULT_COMPARISON_SETTINGS,
      accountTypeFilter: {
        ...DEFAULT_COMPARISON_SETTINGS.accountTypeFilter,
        jointBanking: "required",
      },
    };
    const JOINT_ONLY_REQUIRED: ComparisonSettings = {
      ...DEFAULT_COMPARISON_SETTINGS,
      accountTypeFilter: {
        ...DEFAULT_COMPARISON_SETTINGS.accountTypeFilter,
        jointBanking: "required",
        jointOnly: true,
      },
    };

    it("meets jointOrShared with either a joint or a shared account, marks a bank with neither unmet", () => {
      const comparison = compareBanks({
        profiles: PROFILES,
        levels: BASE_LEVELS,
        currentInstitutionIds: [],
        settings: JOINT_REQUIRED,
      });
      const nubank = comparison.reviewed.find((score) => score.institutionId === "nubank");
      const inter = comparison.reviewed.find((score) => score.institutionId === "inter");

      expect(nubank?.unmetRequirements).toEqual([]);
      expect(inter?.unmetRequirements).toEqual(["jointOrShared"]);
      expect(comparison.noneMeetsRequirements).toBe(false);
    });

    it("jointOnly demands a true joint account: a shared-only bank still fails", () => {
      const comparison = compareBanks({
        profiles: PROFILES,
        levels: BASE_LEVELS,
        currentInstitutionIds: [],
        settings: JOINT_ONLY_REQUIRED,
      });
      const nubank = comparison.reviewed.find((score) => score.institutionId === "nubank");
      const itau = comparison.reviewed.find((score) => score.institutionId === "itau");

      expect(nubank?.unmetRequirements).toEqual(["joint"]);
      expect(itau?.unmetRequirements).toEqual([]);
    });

    it("never yields a candidate that misses a requirement", () => {
      const comparison = compareBanks({
        profiles: PROFILES,
        levels: BASE_LEVELS,
        currentInstitutionIds: [],
        settings: JOINT_ONLY_REQUIRED,
      });

      expect(comparison.candidates.map((candidate) => candidate.institutionId)).toEqual([
        "itau",
        "santander",
      ]);
    });

    it("says no bank meets the requirements only when every reviewed bank fails", () => {
      const noBankMeetsIt = compareBanks({
        profiles: PROFILES,
        levels: BASE_LEVELS,
        currentInstitutionIds: [],
        settings: {
          ...DEFAULT_COMPARISON_SETTINGS,
          accountTypeFilter: {
            ...DEFAULT_COMPARISON_SETTINGS.accountTypeFilter,
            jointInvestment: "required",
          },
        },
      });

      expect(noBankMeetsIt.candidates).toEqual([]);
      expect(noBankMeetsIt.noneMeetsRequirements).toBe(true);

      const someBankMeetsIt = compareBanks({
        profiles: PROFILES,
        levels: BASE_LEVELS,
        currentInstitutionIds: [],
        settings: JOINT_REQUIRED,
      });

      expect(someBankMeetsIt.noneMeetsRequirements).toBe(false);
    });

    it("never says no bank meets the requirements when the household sets none", () => {
      const comparison = compareBanks({
        profiles: PROFILES,
        levels: BASE_LEVELS,
        currentInstitutionIds: [],
        settings: DEFAULT_COMPARISON_SETTINGS,
      });

      expect(comparison.noneMeetsRequirements).toBe(false);
    });

    it("orders reviewed banks that meet every requirement before the ones that miss one", () => {
      const comparison = compareBanks({
        profiles: PROFILES,
        levels: BASE_LEVELS,
        currentInstitutionIds: [],
        settings: JOINT_ONLY_REQUIRED,
      });

      const meetsCount = comparison.reviewed.filter(
        (score) => score.unmetRequirements.length === 0,
      ).length;
      const metPrefix = comparison.reviewed.slice(0, meetsCount);
      const missedSuffix = comparison.reviewed.slice(meetsCount);

      expect(metPrefix.every((score) => score.unmetRequirements.length === 0)).toBe(true);
      expect(missedSuffix.every((score) => score.unmetRequirements.length > 0)).toBe(true);
      expect(metPrefix.map((score) => score.institutionId)).toEqual(["itau", "santander"]);
    });

    it("combines jointBanking and mei requirements", () => {
      const comparison = compareBanks({
        profiles: PROFILES,
        levels: BASE_LEVELS,
        currentInstitutionIds: [],
        settings: {
          ...DEFAULT_COMPARISON_SETTINGS,
          accountTypeFilter: {
            jointBanking: "required",
            jointOnly: false,
            jointInvestment: "optional",
            mei: "required",
          },
        },
      });
      const metIds = comparison.reviewed
        .filter((score) => score.unmetRequirements.length === 0)
        .map((score) => score.institutionId);

      expect(metIds).toEqual(["santander"]);
    });

    it("overrides the candidate count and the pro/con threshold from settings", () => {
      const settings: ComparisonSettings = {
        ...DEFAULT_COMPARISON_SETTINGS,
        candidateCount: 1,
        proConMinDifference: 30,
      };
      const comparison = compareBanks({
        profiles: PROFILES,
        levels: BASE_LEVELS,
        currentInstitutionIds: ["itau", "inter"],
        settings,
      });

      expect(comparison.candidates).toHaveLength(1);
      expect(comparison.candidates[0]?.cons).toEqual([]);
    });
  });
});

describe("resolveComparisonSettings", () => {
  it("falls back to every default when nothing is stored", () => {
    expect(resolveComparisonSettings({})).toEqual(DEFAULT_COMPARISON_SETTINGS);
  });

  it("keeps a valid stored value and falls back per field otherwise", () => {
    expect(
      resolveComparisonSettings({
        candidateCount: 2,
        proConMinDifference: 7,
        accountTypeFilter: { jointBanking: "required" },
      }),
    ).toEqual({
      candidateCount: 2,
      proConMinDifference: DEFAULT_COMPARISON_SETTINGS.proConMinDifference,
      accountTypeFilter: {
        ...DEFAULT_COMPARISON_SETTINGS.accountTypeFilter,
        jointBanking: "required",
      },
    });
  });

  it("refuses a step violation", () => {
    expect(resolveComparisonSettings({ proConMinDifference: 11 })).toEqual(
      DEFAULT_COMPARISON_SETTINGS,
    );
  });

  it("keeps a valid stored proConMinDifference", () => {
    expect(resolveComparisonSettings({ proConMinDifference: 15 })).toEqual({
      ...DEFAULT_COMPARISON_SETTINGS,
      proConMinDifference: 15,
    });
  });
});

function nulls(): Scores {
  return {
    cardBenefits: null,
    investmentAccess: null,
    appQuality: null,
    security: null,
    fees: null,
    lockIn: null,
    publicReviews: null,
  };
}
