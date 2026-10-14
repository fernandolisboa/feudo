import { describe, expect, it } from "vitest";

import type { BankProfileCriterion } from "./criteria";
import {
  compareBanks,
  DEFAULT_CANDIDATE_COUNT,
  DEFAULT_COMPARISON_SETTINGS,
  DEFAULT_MINIMUM_SCORES,
  DEFAULT_PRO_CON_MIN_DIFFERENCE,
  rankBankProfiles,
  resolveComparisonSettings,
  type ComparisonSettings,
  type ScorableBankProfile,
  type ScorableCriterionEntry,
} from "./scoring";
import { InvalidCriteriaWeightsError, type CriteriaWeights } from "./weights";

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
      jointBanking: entry(scores.jointBanking, reviewedAt),
    },
  };
}

// Mirrors the product defaults for the original seven criteria (packages/core
// weights.ts), with jointBanking left at zero so the scoring math below
// matches the fixtures copied from the shipped dataset before jointBanking
// existed (PR #105).
const BASE_WEIGHTS: CriteriaWeights = {
  cardBenefits: 2,
  investmentAccess: 3,
  appQuality: 3,
  security: 4,
  fees: 5,
  lockIn: 4,
  publicReviews: 4,
  jointBanking: 0,
};

const NUBANK = profile("nubank", {
  cardBenefits: 60,
  investmentAccess: 80,
  appQuality: 80,
  security: 60,
  fees: 100,
  lockIn: 60,
  publicReviews: 87,
  jointBanking: 65,
});
const INTER = profile("inter", {
  cardBenefits: 60,
  investmentAccess: 80,
  appQuality: 60,
  security: 40,
  fees: 80,
  lockIn: 60,
  publicReviews: 85,
  jointBanking: 0,
});
const ITAU = profile("itau", {
  cardBenefits: 80,
  investmentAccess: 80,
  appQuality: null,
  security: null,
  fees: 40,
  lockIn: 40,
  publicReviews: 81,
  jointBanking: 100,
});
const C6 = profile("c6", {
  cardBenefits: 80,
  investmentAccess: 60,
  appQuality: null,
  security: 80,
  fees: 80,
  lockIn: 60,
  publicReviews: 72,
  jointBanking: 65,
});
const BTG = profile("btg", {
  cardBenefits: 60,
  investmentAccess: 100,
  appQuality: null,
  security: null,
  fees: 100,
  lockIn: 40,
  publicReviews: 74,
  jointBanking: 65,
});
const SANTANDER = profile("santander", {
  cardBenefits: null,
  investmentAccess: 80,
  appQuality: 40,
  security: null,
  fees: 40,
  lockIn: 20,
  publicReviews: 57,
  jointBanking: 100,
});

const PROFILES = [NUBANK, INTER, ITAU, C6, BTG, SANTANDER];

const ONLY_FEES: CriteriaWeights = {
  cardBenefits: 0,
  investmentAccess: 0,
  appQuality: 0,
  security: 0,
  fees: 1,
  lockIn: 0,
  publicReviews: 0,
  jointBanking: 0,
};

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

  it("never gates without a required criterion: every bank meets requirements vacuously", () => {
    const ranked = rankBankProfiles(PROFILES, BASE_WEIGHTS);

    expect(ranked.every((score) => score.unmetRequirements.length === 0)).toBe(true);
  });
});

describe("compareBanks", () => {
  it(`offers the top ${String(DEFAULT_CANDIDATE_COUNT)} institutions the household does not use`, () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      weights: BASE_WEIGHTS,
      currentInstitutionIds: ["itau", "inter"],
    });

    expect(comparison.baseline).toBe("current");
    expect(comparison.current.map((score) => score.institutionId)).toEqual(["inter", "itau"]);
    expect(comparison.candidates.map((candidate) => candidate.institutionId)).toEqual([
      "nubank",
      "btg",
      "c6",
    ]);
  });

  it("scores every profiled institution, the household's own and the candidates alike", () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      weights: BASE_WEIGHTS,
      currentInstitutionIds: ["itau", "inter"],
    });

    expect(comparison.reviewed).toHaveLength(PROFILES.length);
    expect(new Set(comparison.reviewed.map((score) => score.institutionId))).toEqual(
      new Set(PROFILES.map((profile) => profile.institutionId)),
    );
  });

  it("sets each candidate against the best score the household already has on every weighted criterion", () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      weights: BASE_WEIGHTS,
      currentInstitutionIds: ["itau", "inter"],
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
      weights: BASE_WEIGHTS,
      currentInstitutionIds: ["santander"],
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
      weights: { ...BASE_WEIGHTS, lockIn: 0 },
      currentInstitutionIds: ["itau"],
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
      weights: BASE_WEIGHTS,
      currentInstitutionIds: ["nubank"],
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
      weights: ONLY_FEES,
      currentInstitutionIds: ["unknown-bank"],
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
      weights: ONLY_FEES,
      currentInstitutionIds: [],
    });

    expect(comparison.candidates.map((candidate) => candidate.institutionId)).toEqual(["nubank"]);
  });

  it("has no baseline for a criterion none of the household's institutions has evidence on", () => {
    const comparison = compareBanks({
      profiles: [ITAU, C6],
      weights: { ...ONLY_FEES, fees: 0, security: 1 },
      currentInstitutionIds: ["itau"],
    });

    expect(comparison.candidates[0]?.pros).toEqual([]);
    expect(comparison.candidates[0]?.cons).toEqual([]);
  });

  const ONLY_JOINT: CriteriaWeights = { ...ONLY_FEES, fees: 0, jointBanking: 1 };

  describe("the requirement gate (ADR-0006, 2026-10-14)", () => {
    it("marks a required criterion unmet when the bank is scored below the minimum", () => {
      const comparison = compareBanks({
        profiles: PROFILES,
        weights: ONLY_JOINT,
        currentInstitutionIds: [],
        requiredCriteria: ["jointBanking"],
      });
      const nubank = comparison.reviewed.find((score) => score.institutionId === "nubank");
      const itau = comparison.reviewed.find((score) => score.institutionId === "itau");

      expect(nubank?.unmetRequirements).toEqual(["jointBanking"]);
      expect(itau?.unmetRequirements).toEqual([]);
    });

    it("treats insufficient evidence on a required criterion as unmet, never a guess", () => {
      const noEvidence = profile("no-evidence", nulls());

      const comparison = compareBanks({
        profiles: [noEvidence],
        weights: ONLY_JOINT,
        currentInstitutionIds: [],
        requiredCriteria: ["jointBanking"],
      });

      expect(comparison.reviewed[0]?.unmetRequirements).toEqual(["jointBanking"]);
    });

    it("never yields a candidate that misses a requirement", () => {
      const comparison = compareBanks({
        profiles: PROFILES,
        weights: ONLY_JOINT,
        currentInstitutionIds: [],
        requiredCriteria: ["jointBanking"],
      });

      expect(comparison.candidates.map((candidate) => candidate.institutionId)).toEqual([
        "itau",
        "santander",
      ]);
    });

    it("orders reviewed banks that meet every requirement before the ones that miss one", () => {
      const comparison = compareBanks({
        profiles: PROFILES,
        weights: BASE_WEIGHTS,
        currentInstitutionIds: [],
        requiredCriteria: ["jointBanking"],
        settings: {
          minimumScores: { ...DEFAULT_MINIMUM_SCORES, jointBanking: 100 },
          candidateCount: DEFAULT_CANDIDATE_COUNT,
          proConMinDifference: 10,
        },
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

    it("overrides the candidate count and the pro/con threshold from settings", () => {
      const settings: ComparisonSettings = {
        minimumScores: DEFAULT_MINIMUM_SCORES,
        candidateCount: 1,
        proConMinDifference: 30,
      };
      const comparison = compareBanks({
        profiles: PROFILES,
        weights: BASE_WEIGHTS,
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
        minimumScores: { jointBanking: 65, fees: 999 },
        candidateCount: 2,
        proConMinDifference: 7,
      }),
    ).toEqual({
      minimumScores: { ...DEFAULT_MINIMUM_SCORES, jointBanking: 65 },
      candidateCount: 2,
      proConMinDifference: DEFAULT_PRO_CON_MIN_DIFFERENCE,
    });
  });

  it("refuses a step violation", () => {
    expect(resolveComparisonSettings({ proConMinDifference: 11 })).toEqual(
      DEFAULT_COMPARISON_SETTINGS,
    );
    expect(resolveComparisonSettings({ minimumScores: { fees: 61 } })).toEqual({
      ...DEFAULT_COMPARISON_SETTINGS,
      minimumScores: DEFAULT_MINIMUM_SCORES,
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
    jointBanking: null,
  };
}
