import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";
import { assertScorableWeights, type CriteriaWeights } from "./weights";

export const BANK_COMPARISON_CANDIDATES = 3;
export const PRO_CON_MIN_DIFFERENCE = 10;

export type ScorableCriterionEntry =
  | { status: "scored"; score: number; reviewedAt: string }
  | { status: "insufficient-evidence"; reviewedAt: string };

export type ScorableBankProfile = {
  institutionId: string;
  criteria: Readonly<Record<BankProfileCriterion, ScorableCriterionEntry>>;
};

export type BankScore = {
  institutionId: string;
  score: number | null;
  reviewedAt: string;
  missingEvidence: BankProfileCriterion[];
};

export type CriterionComparison = {
  criterion: BankProfileCriterion;
  candidateScore: number;
  baselineScore: number;
  baselineInstitutionId: string | null;
  difference: number;
};

export type BankCandidate = BankScore & {
  pros: CriterionComparison[];
  cons: CriterionComparison[];
};

export type BankComparison = {
  baseline: "current" | "median";
  current: BankScore[];
  candidates: BankCandidate[];
};

type WeightedScore = BankScore & {
  profile: ScorableBankProfile;
  weightedSum: number;
  evidencedWeight: number;
};

function oldestReview(profile: ScorableBankProfile): string {
  return BANK_PROFILE_CRITERIA.map((criterion) => profile.criteria[criterion].reviewedAt).reduce(
    (oldest, reviewedAt) => (reviewedAt < oldest ? reviewedAt : oldest),
  );
}

function roundedRatio(numerator: number, denominator: number): number {
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

// A criterion without evidence is left out and the remaining weights are
// renormalised over what is evidenced, because ADR-0006 forbids standing in a
// guessed score; missingEvidence says which weighted criteria were dropped.
function weightedScore(profile: ScorableBankProfile, weights: CriteriaWeights): WeightedScore {
  let weightedSum = 0;
  let evidencedWeight = 0;
  const missingEvidence: BankProfileCriterion[] = [];
  for (const criterion of BANK_PROFILE_CRITERIA) {
    const weight = weights[criterion];
    if (weight === 0) continue;
    const entry = profile.criteria[criterion];
    if (entry.status === "scored") {
      weightedSum += weight * entry.score;
      evidencedWeight += weight;
    } else {
      missingEvidence.push(criterion);
    }
  }
  return {
    institutionId: profile.institutionId,
    score: evidencedWeight === 0 ? null : roundedRatio(weightedSum, evidencedWeight),
    reviewedAt: oldestReview(profile),
    missingEvidence,
    profile,
    weightedSum,
    evidencedWeight,
  };
}

// Compares the exact weighted means by cross-multiplication so that two
// scores that round to the same integer still rank by their real values.
function byScoreDescending(a: WeightedScore, b: WeightedScore): number {
  if (a.evidencedWeight === 0 || b.evidencedWeight === 0) {
    return (a.evidencedWeight === 0 ? 1 : 0) - (b.evidencedWeight === 0 ? 1 : 0);
  }
  return b.weightedSum * a.evidencedWeight - a.weightedSum * b.evidencedWeight;
}

function withoutInternals({
  institutionId,
  score,
  reviewedAt,
  missingEvidence,
}: WeightedScore): BankScore {
  return { institutionId, score, reviewedAt, missingEvidence };
}

function rankWeighted(
  profiles: readonly ScorableBankProfile[],
  weights: CriteriaWeights,
): WeightedScore[] {
  assertScorableWeights(weights);
  return profiles.map((profile) => weightedScore(profile, weights)).sort(byScoreDescending);
}

// Ties keep the input order: Array.prototype.sort is stable.
export function rankBankProfiles(
  profiles: readonly ScorableBankProfile[],
  weights: CriteriaWeights,
): BankScore[] {
  return rankWeighted(profiles, weights).map(withoutInternals);
}

type Baseline = { score: number; institutionId: string | null };

function scoreOf(profile: ScorableBankProfile, criterion: BankProfileCriterion): number | null {
  const entry = profile.criteria[criterion];
  return entry.status === "scored" ? entry.score : null;
}

function bestCurrent(
  current: readonly ScorableBankProfile[],
  criterion: BankProfileCriterion,
): Baseline | null {
  let best: Baseline | null = null;
  for (const profile of current) {
    const score = scoreOf(profile, criterion);
    if (score !== null && (best === null || score > best.score)) {
      best = { score, institutionId: profile.institutionId };
    }
  }
  return best;
}

// The lower median keeps the baseline an integer score some bank actually has.
function lowerMedian(
  profiles: readonly ScorableBankProfile[],
  criterion: BankProfileCriterion,
): Baseline | null {
  const scores = profiles
    .map((profile) => scoreOf(profile, criterion))
    .filter((score): score is number => score !== null)
    .sort((a, b) => a - b);
  const median = scores[Math.floor((scores.length - 1) / 2)];
  return median === undefined ? null : { score: median, institutionId: null };
}

function prosAndCons(
  candidate: ScorableBankProfile,
  baselines: ReadonlyMap<BankProfileCriterion, Baseline>,
  weights: CriteriaWeights,
): Pick<BankCandidate, "pros" | "cons"> {
  const comparisons: CriterionComparison[] = [];
  for (const criterion of BANK_PROFILE_CRITERIA) {
    const baseline = baselines.get(criterion);
    const candidateScore = scoreOf(candidate, criterion);
    if (weights[criterion] === 0 || baseline === undefined || candidateScore === null) continue;
    comparisons.push({
      criterion,
      candidateScore,
      baselineScore: baseline.score,
      baselineInstitutionId: baseline.institutionId,
      difference: candidateScore - baseline.score,
    });
  }
  const byWeightedGap = (a: CriterionComparison, b: CriterionComparison): number =>
    weights[b.criterion] * Math.abs(b.difference) - weights[a.criterion] * Math.abs(a.difference);
  return {
    pros: comparisons
      .filter((comparison) => comparison.difference >= PRO_CON_MIN_DIFFERENCE)
      .sort(byWeightedGap),
    cons: comparisons
      .filter((comparison) => comparison.difference <= -PRO_CON_MIN_DIFFERENCE)
      .sort(byWeightedGap),
  };
}

// The bank comparison of ADR-0006: the top candidates the household does not
// use yet, each set against the best score the household's own institutions
// already reach on every weighted criterion. A household whose institutions
// are all unrecognised is compared against the median bank instead.
export function compareBanks(input: {
  profiles: readonly ScorableBankProfile[];
  weights: CriteriaWeights;
  currentInstitutionIds: readonly string[];
}): BankComparison {
  const { profiles, weights } = input;
  const currentIds = new Set(input.currentInstitutionIds);
  const ranked = rankWeighted(profiles, weights);
  const current = ranked.filter((score) => currentIds.has(score.institutionId));
  const currentProfiles = current.map((score) => score.profile);
  const baseline = currentProfiles.length > 0 ? "current" : "median";

  const baselines = new Map<BankProfileCriterion, Baseline>();
  for (const criterion of BANK_PROFILE_CRITERIA) {
    const found =
      baseline === "current"
        ? bestCurrent(currentProfiles, criterion)
        : lowerMedian(profiles, criterion);
    if (found !== null) baselines.set(criterion, found);
  }

  const candidates = ranked
    .filter((score) => score.score !== null && !currentIds.has(score.institutionId))
    .slice(0, BANK_COMPARISON_CANDIDATES)
    .map((score) => ({
      ...withoutInternals(score),
      ...prosAndCons(score.profile, baselines, weights),
    }));

  return {
    baseline,
    current: current.map(withoutInternals),
    candidates,
  };
}
