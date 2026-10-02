import { describe, expect, it } from "vitest";

import type { BankProfileCriterion } from "./criteria";
import {
  BANK_COMPARISON_CANDIDATES,
  compareBanks,
  rankBankProfiles,
  type ScorableBankProfile,
  type ScorableCriterionEntry,
} from "./scoring";
import {
  DEFAULT_CRITERIA_WEIGHTS,
  InvalidCriteriaWeightsError,
  type CriteriaWeights,
} from "./weights";

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
    },
  };
}

// Scores copied from the shipped bank-profiles dataset (PR #105).
const NUBANK = profile("nubank", {
  cardBenefits: 60,
  investmentAccess: 80,
  appQuality: 80,
  security: 60,
  fees: 100,
  lockIn: 60,
  publicReviews: 87,
});
const INTER = profile("inter", {
  cardBenefits: 60,
  investmentAccess: 80,
  appQuality: 60,
  security: 40,
  fees: 80,
  lockIn: 60,
  publicReviews: 85,
});
const ITAU = profile("itau", {
  cardBenefits: 80,
  investmentAccess: 80,
  appQuality: null,
  security: null,
  fees: 40,
  lockIn: 40,
  publicReviews: 81,
});
const C6 = profile("c6", {
  cardBenefits: 80,
  investmentAccess: 60,
  appQuality: null,
  security: 80,
  fees: 80,
  lockIn: 60,
  publicReviews: 72,
});
const BTG = profile("btg", {
  cardBenefits: 60,
  investmentAccess: 100,
  appQuality: null,
  security: null,
  fees: 100,
  lockIn: 40,
  publicReviews: 74,
});
const SANTANDER = profile("santander", {
  cardBenefits: null,
  investmentAccess: 80,
  appQuality: 40,
  security: null,
  fees: 40,
  lockIn: 20,
  publicReviews: 57,
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
};

describe("rankBankProfiles", () => {
  it("scores each profile as the weighted mean of its evidenced criteria, rounded half up", () => {
    const [first] = rankBankProfiles([ITAU], DEFAULT_CRITERIA_WEIGHTS);

    // (2·80 + 3·80 + 5·40 + 4·40 + 4·81) / (2 + 3 + 5 + 4 + 4) = 1084 / 18 = 60.2
    expect(first?.score).toBe(60);
    expect(first?.missingEvidence).toEqual(["appQuality", "security"]);
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

  it("orders the shipped profiles under the default weights", () => {
    expect(
      rankBankProfiles(PROFILES, DEFAULT_CRITERIA_WEIGHTS).map((score) => score.institutionId),
    ).toEqual(["nubank", "btg", "c6", "inter", "itau", "santander"]);
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

    expect(rankBankProfiles([mixed], DEFAULT_CRITERIA_WEIGHTS)[0]?.reviewedAt).toBe("2026-03-01");
  });

  it("refuses weights that leave nothing to weigh", () => {
    expect(() => rankBankProfiles(PROFILES, { ...ONLY_FEES, fees: 0 })).toThrow(
      InvalidCriteriaWeightsError,
    );
  });
});

describe("compareBanks", () => {
  it(`offers the top ${String(BANK_COMPARISON_CANDIDATES)} institutions the household does not use`, () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      weights: DEFAULT_CRITERIA_WEIGHTS,
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

  it("sets each candidate against the best score the household already has on every weighted criterion", () => {
    const comparison = compareBanks({
      profiles: PROFILES,
      weights: DEFAULT_CRITERIA_WEIGHTS,
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
      weights: DEFAULT_CRITERIA_WEIGHTS,
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
      weights: { ...DEFAULT_CRITERIA_WEIGHTS, lockIn: 0 },
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
      weights: DEFAULT_CRITERIA_WEIGHTS,
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
