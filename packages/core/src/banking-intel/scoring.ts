import { BANK_PROFILE_CRITERIA, type BankProfileCriterion } from "./criteria";
import { assertScorableWeights, type CriteriaWeights } from "./weights";

export const MINIMUM_SCORE_MIN = 0;
export const MINIMUM_SCORE_MAX = 100;
export const MINIMUM_SCORE_STEP = 5;
export const CANDIDATE_COUNT_MIN = 1;
export const CANDIDATE_COUNT_MAX = 5;
export const PRO_CON_MIN_DIFFERENCE_MIN = 5;
export const PRO_CON_MIN_DIFFERENCE_MAX = 30;
export const PRO_CON_MIN_DIFFERENCE_STEP = 5;

export const DEFAULT_CANDIDATE_COUNT = 3;
export const DEFAULT_PRO_CON_MIN_DIFFERENCE = 10;

// A required jointBanking score of 100 means only a true joint account
// meets it; every other criterion defaults to a middling 60.
export const DEFAULT_MINIMUM_SCORES: Readonly<Record<BankProfileCriterion, number>> =
  Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => [criterion, criterion === "jointBanking" ? 100 : 60]),
  ) as Record<BankProfileCriterion, number>;

export type ComparisonSettings = {
  minimumScores: Readonly<Record<BankProfileCriterion, number>>;
  candidateCount: number;
  proConMinDifference: number;
};

export const DEFAULT_COMPARISON_SETTINGS: ComparisonSettings = {
  minimumScores: DEFAULT_MINIMUM_SCORES,
  candidateCount: DEFAULT_CANDIDATE_COUNT,
  proConMinDifference: DEFAULT_PRO_CON_MIN_DIFFERENCE,
};

function isStep(value: number, step: number): boolean {
  return value % step === 0;
}

export function isValidMinimumScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MINIMUM_SCORE_MIN &&
    value <= MINIMUM_SCORE_MAX &&
    isStep(value, MINIMUM_SCORE_STEP)
  );
}

export function isValidCandidateCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= CANDIDATE_COUNT_MIN &&
    value <= CANDIDATE_COUNT_MAX
  );
}

export function isValidProConMinDifference(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= PRO_CON_MIN_DIFFERENCE_MIN &&
    value <= PRO_CON_MIN_DIFFERENCE_MAX &&
    isStep(value, PRO_CON_MIN_DIFFERENCE_STEP)
  );
}

export type StoredComparisonSettings = {
  minimumScores?: Partial<Record<BankProfileCriterion, unknown>>;
  candidateCount?: unknown;
  proConMinDifference?: unknown;
};

// Stored settings are household data that may predate a field added to the
// product later, or simply never have been set: each field falls back to
// its own product default independently, the same policy as
// resolveCriteriaWeights.
export function resolveComparisonSettings(stored: StoredComparisonSettings): ComparisonSettings {
  const minimumScores = Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => {
      const value = stored.minimumScores?.[criterion];
      return [criterion, isValidMinimumScore(value) ? value : DEFAULT_MINIMUM_SCORES[criterion]];
    }),
  ) as Record<BankProfileCriterion, number>;
  return {
    minimumScores,
    candidateCount: isValidCandidateCount(stored.candidateCount)
      ? stored.candidateCount
      : DEFAULT_CANDIDATE_COUNT,
    proConMinDifference: isValidProConMinDifference(stored.proConMinDifference)
      ? stored.proConMinDifference
      : DEFAULT_PRO_CON_MIN_DIFFERENCE,
  };
}

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
  unmetRequirements: BankProfileCriterion[];
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
  reviewed: BankScore[];
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

function unmetRequirementsOf(
  profile: ScorableBankProfile,
  requiredCriteria: readonly BankProfileCriterion[],
  minimumScores: Readonly<Record<BankProfileCriterion, number>>,
): BankProfileCriterion[] {
  return requiredCriteria.filter((criterion) => {
    const entry = profile.criteria[criterion];
    return entry.status !== "scored" || entry.score < minimumScores[criterion];
  });
}

// A criterion without evidence is left out and the remaining weights are
// renormalised over what is evidenced, because ADR-0006 forbids standing in a
// guessed score; missingEvidence says which weighted criteria were dropped.
function weightedScore(
  profile: ScorableBankProfile,
  weights: CriteriaWeights,
  requiredCriteria: readonly BankProfileCriterion[],
  minimumScores: Readonly<Record<BankProfileCriterion, number>>,
): WeightedScore {
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
    unmetRequirements: unmetRequirementsOf(profile, requiredCriteria, minimumScores),
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

// Banks meeting every required criterion rank before banks that miss one or
// more, each group then ordered as above; a bank with no required criteria
// configured meets them vacuously, which keeps this the same as plain score
// ordering when the household sets no required criterion.
function byRequirementsThenScore(a: WeightedScore, b: WeightedScore): number {
  const aMisses = a.unmetRequirements.length > 0 ? 1 : 0;
  const bMisses = b.unmetRequirements.length > 0 ? 1 : 0;
  return aMisses - bMisses || byScoreDescending(a, b);
}

function withoutInternals({
  institutionId,
  score,
  reviewedAt,
  missingEvidence,
  unmetRequirements,
}: WeightedScore): BankScore {
  return { institutionId, score, reviewedAt, missingEvidence, unmetRequirements };
}

function rankWeighted(
  profiles: readonly ScorableBankProfile[],
  weights: CriteriaWeights,
  requiredCriteria: readonly BankProfileCriterion[],
  minimumScores: Readonly<Record<BankProfileCriterion, number>>,
): WeightedScore[] {
  assertScorableWeights(weights);
  return profiles
    .map((profile) => weightedScore(profile, weights, requiredCriteria, minimumScores))
    .sort(byScoreDescending);
}

// Ties keep the input order: Array.prototype.sort is stable.
export function rankBankProfiles(
  profiles: readonly ScorableBankProfile[],
  weights: CriteriaWeights,
): BankScore[] {
  return rankWeighted(profiles, weights, [], DEFAULT_MINIMUM_SCORES).map(withoutInternals);
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
  proConMinDifference: number,
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
      .filter((comparison) => comparison.difference >= proConMinDifference)
      .sort(byWeightedGap),
    cons: comparisons
      .filter((comparison) => comparison.difference <= -proConMinDifference)
      .sort(byWeightedGap),
  };
}

// The bank comparison of ADR-0006: every profiled institution in score order,
// banks that miss a required criterion (ADR-0006, 2026-10-14) ranked after
// the ones that meet every requirement, and the top candidates the household
// does not use yet among those that meet every requirement, each set against
// the best score the household's own institutions already reach on every
// weighted criterion. A household whose institutions are all unrecognised is
// compared against the median bank instead.
export function compareBanks(input: {
  profiles: readonly ScorableBankProfile[];
  weights: CriteriaWeights;
  currentInstitutionIds: readonly string[];
  requiredCriteria?: readonly BankProfileCriterion[];
  settings?: ComparisonSettings;
}): BankComparison {
  const { profiles, weights } = input;
  const requiredCriteria = input.requiredCriteria ?? [];
  const settings = input.settings ?? DEFAULT_COMPARISON_SETTINGS;
  const currentIds = new Set(input.currentInstitutionIds);
  const ranked = rankWeighted(profiles, weights, requiredCriteria, settings.minimumScores);
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
    .filter(
      (score) =>
        score.score !== null &&
        score.unmetRequirements.length === 0 &&
        !currentIds.has(score.institutionId),
    )
    .slice(0, settings.candidateCount)
    .map((score) => ({
      ...withoutInternals(score),
      ...prosAndCons(score.profile, baselines, weights, settings.proConMinDifference),
    }));

  return {
    baseline,
    reviewed: [...ranked].sort(byRequirementsThenScore).map(withoutInternals),
    current: current.map(withoutInternals),
    candidates,
  };
}
