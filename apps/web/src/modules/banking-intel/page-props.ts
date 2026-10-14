import {
  BANK_PROFILE_CRITERIA,
  compareBanks,
  criterionShares,
  effectiveWeights,
  localDateOf,
  type BankCandidate,
  type BankComparison,
  type BankProfileCriterion,
  type BankScore,
  type ComparisonSettings,
  type CriterionComparison,
  type CriterionWeightLevel,
  type WeightLevels,
} from "@feudo/core";
import { institutionById, isStale } from "@feudo/core/reference-data";

import {
  canManageHouseholdSettings,
  DEFAULT_TIME_ZONE,
  getHouseholdSettings,
  getViewerRole,
  householdScope,
  type HouseholdScope,
  type HouseholdSession,
} from "@/modules/households";

import { formatIsoDate } from "@/lib/format-date";
import { interpolate, interpolateAll } from "@/lib/interpolate";
import { getDb } from "@/platform/db/client";
import { BANK_PROFILES } from "./bank-profiles";
import { levelLabel } from "./level-label";
import { getHouseholdCriteriaWeights, getHouseholdInstitutions } from "./service";
import { t } from "./strings";

export type CriterionWeightView = {
  criterion: BankProfileCriterion;
  label: string;
  help: string;
  level: CriterionWeightLevel;
  levelLabel: string;
  share: number;
  isRequired: boolean;
  minimumScore: number;
  minimumScoreHint: string | null;
};

export type ComparisonOptionsView = {
  candidateCount: number;
  proConMinDifference: number;
};

export type ReviewView = { label: string; stale: boolean };

export type CurrentBankRow = {
  institutionId: string;
  name: string;
  scoreLabel: string;
  review: ReviewView;
};

export type ReviewedBankRow = {
  institutionId: string;
  positionLabel: string;
  name: string;
  tag: string | null;
  unmetLabel: string | null;
  scoreLabel: string;
  review: ReviewView;
};

export type CandidateView = {
  institutionId: string;
  rankLabel: string;
  name: string;
  scoreLabel: string;
  review: ReviewView;
  pros: string[];
  cons: string[];
  emptyPros: string;
  emptyCons: string;
  missingEvidence: string | null;
};

export type BanksPageProps = {
  headline: string;
  canManage: boolean;
  weightsAreCustom: boolean;
  weights: CriterionWeightView[];
  options: ComparisonOptionsView;
  hasAccounts: boolean;
  currentRows: CurrentBankRow[];
  baselineNotice: string | null;
  unrecognizedNotice: string | null;
  candidates: CandidateView[];
  reviewed: ReviewedBankRow[];
};

function institutionName(institutionId: string): string {
  return institutionById(institutionId)?.name ?? institutionId;
}

function criterionLabel(criterion: BankProfileCriterion): string {
  return t.criteria[criterion].label;
}

function scoreLabel(score: number | null): string {
  return score === null ? t.candidates.noScore : String(score);
}

function reviewView(reviewedAt: string, today: string): ReviewView {
  return {
    label: interpolate(t.candidates.reviewedAt, "{date}", formatIsoDate(reviewedAt)),
    stale: isStale(reviewedAt, today),
  };
}

function comparisonLine(item: CriterionComparison): string {
  return interpolateAll(t.candidates.comparison, {
    criterion: criterionLabel(item.criterion),
    candidate: String(item.candidateScore),
    baseline: String(item.baselineScore),
    bank:
      item.baselineInstitutionId === null
        ? t.candidates.median
        : institutionName(item.baselineInstitutionId),
  });
}

function weightViews(levels: WeightLevels, options: ComparisonSettings): CriterionWeightView[] {
  const shares = criterionShares(effectiveWeights(levels));
  return BANK_PROFILE_CRITERIA.map((criterion) => {
    const level = levels[criterion];
    return {
      criterion,
      label: t.criteria[criterion].label,
      help: t.criteria[criterion].help,
      level,
      levelLabel: levelLabel(level),
      share: shares[criterion],
      isRequired: level === "required",
      minimumScore: options.minimumScores[criterion],
      minimumScoreHint: criterion === "jointBanking" ? t.weights.jointBankingHint : null,
    };
  });
}

function unmetLabel(unmetRequirements: readonly BankProfileCriterion[]): string | null {
  return unmetRequirements.length === 0
    ? null
    : interpolate(t.reviewed.unmet, "{criteria}", unmetRequirements.map(criterionLabel).join(", "));
}

function currentRow(score: BankScore, today: string): CurrentBankRow {
  return {
    institutionId: score.institutionId,
    name: institutionName(score.institutionId),
    scoreLabel: scoreLabel(score.score),
    review: reviewView(score.reviewedAt, today),
  };
}

function reviewedRows(comparison: BankComparison, today: string): ReviewedBankRow[] {
  const currentIds = new Set(comparison.current.map((score) => score.institutionId));
  const candidateIds = new Set(comparison.candidates.map((score) => score.institutionId));
  return comparison.reviewed.map((score, index) => ({
    institutionId: score.institutionId,
    positionLabel:
      score.score === null
        ? t.reviewed.noPosition
        : interpolate(t.candidates.rank, "{rank}", String(index + 1)),
    name: institutionName(score.institutionId),
    tag: currentIds.has(score.institutionId)
      ? t.reviewed.current
      : candidateIds.has(score.institutionId)
        ? t.reviewed.candidate
        : null,
    unmetLabel: unmetLabel(score.unmetRequirements),
    scoreLabel: scoreLabel(score.score),
    review: reviewView(score.reviewedAt, today),
  }));
}

function candidateView(
  candidate: BankCandidate,
  index: number,
  baseline: "current" | "median",
  proConMinDifference: number,
  today: string,
): CandidateView {
  const threshold = String(proConMinDifference);
  return {
    institutionId: candidate.institutionId,
    rankLabel: interpolate(t.candidates.rank, "{rank}", String(index + 1)),
    name: institutionName(candidate.institutionId),
    scoreLabel: scoreLabel(candidate.score),
    review: reviewView(candidate.reviewedAt, today),
    pros: candidate.pros.map(comparisonLine),
    cons: candidate.cons.map(comparisonLine),
    emptyPros: interpolate(
      baseline === "current" ? t.candidates.noPros : t.candidates.noProsMedian,
      "{threshold}",
      threshold,
    ),
    emptyCons: interpolate(
      baseline === "current" ? t.candidates.noCons : t.candidates.noConsMedian,
      "{threshold}",
      threshold,
    ),
    missingEvidence:
      candidate.missingEvidence.length === 0
        ? null
        : interpolate(
            t.candidates.missingEvidence,
            "{criteria}",
            candidate.missingEvidence.map(criterionLabel).join(", "),
          ),
  };
}

// Everything the Bancos page renders. The ranking, the scores and every pro
// and con come from packages/core's compareBanks over the shipped profiles
// and the household's own weights (ADR-0006); this only turns them into text.
export async function getBanksPageProps(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<BanksPageProps> {
  const viewerRole = await getViewerRole(session, getDb());
  return buildBanksPageProps(householdScope(session), {
    now,
    canManage: canManageHouseholdSettings(viewerRole),
  });
}

export async function buildBanksPageProps(
  scope: HouseholdScope,
  options: { now: Date; canManage: boolean },
): Promise<BanksPageProps> {
  const db = getDb();
  const { now, canManage } = options;

  const [settings, stored, institutions] = await Promise.all([
    getHouseholdSettings(scope, db),
    getHouseholdCriteriaWeights(scope, db),
    getHouseholdInstitutions(scope, db),
  ]);
  const today = localDateOf(now, settings?.timeZone ?? DEFAULT_TIME_ZONE);

  const comparison = compareBanks({
    profiles: BANK_PROFILES,
    levels: stored.levels,
    currentInstitutionIds: institutions.institutionIds,
    settings: stored.options,
  });
  const [top] = comparison.candidates;

  return {
    headline: comparison.noneMeetsRequirements
      ? t.headline.noneMeetsRequirements
      : top
        ? interpolate(t.headline.candidate, "{bank}", institutionName(top.institutionId))
        : t.headline.noCandidate,
    canManage,
    weightsAreCustom: stored.isCustom,
    weights: weightViews(stored.levels, stored.options),
    options: {
      candidateCount: stored.options.candidateCount,
      proConMinDifference: stored.options.proConMinDifference,
    },
    hasAccounts: institutions.hasAccounts,
    currentRows: comparison.current.map((score) => currentRow(score, today)),
    baselineNotice:
      comparison.baseline === "current"
        ? null
        : institutions.hasAccounts
          ? t.current.noneRecognized
          : t.current.noAccounts,
    unrecognizedNotice:
      institutions.unrecognizedLabels.length === 0
        ? null
        : interpolate(
            t.current.unrecognized,
            "{labels}",
            institutions.unrecognizedLabels.join(", "),
          ),
    candidates: comparison.candidates.map((candidate, index) =>
      candidateView(
        candidate,
        index,
        comparison.baseline,
        stored.options.proConMinDifference,
        today,
      ),
    ),
    reviewed: reviewedRows(comparison, today),
  };
}
