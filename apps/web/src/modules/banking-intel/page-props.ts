import {
  applyScoreOverrides,
  BANK_PROFILE_CRITERIA,
  compareBanks,
  criterionShares,
  effectiveWeights,
  localDateOf,
  referenceRevisedSinceOverride,
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
import { BANK_PROFILES, referenceProfileOf } from "./bank-profiles";
import { levelLabel } from "./level-label";
import {
  getHouseholdCriteriaWeights,
  getHouseholdInstitutions,
  getHouseholdOverrides,
  type HouseholdComparisonSettings,
  type HouseholdInstitutions,
} from "./service";
import { t } from "./strings";
import type { StoredOverride } from "./validation";

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
  href: string;
  positionLabel: string;
  name: string;
  tag: string | null;
  overriddenLabel: string | null;
  unmetLabel: string | null;
  scoreLabel: string;
  review: ReviewView;
};

export type CandidateView = {
  institutionId: string;
  href: string;
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
  overridesNotice: string | null;
  candidates: CandidateView[];
  reviewed: ReviewedBankRow[];
};

export function bankHref(institutionId: string): string {
  return `/bancos/${institutionId}`;
}

export function institutionName(institutionId: string): string {
  return institutionById(institutionId)?.name ?? institutionId;
}

export function criterionLabel(criterion: BankProfileCriterion): string {
  return t.criteria[criterion].label;
}

export function scoreLabel(score: number | null): string {
  return score === null ? t.candidates.noScore : String(score);
}

export function reviewView(reviewedAt: string, today: string): ReviewView {
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

export function weightViews(
  levels: WeightLevels,
  options: ComparisonSettings,
): CriterionWeightView[] {
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

export function unmetLabel(unmetRequirements: readonly BankProfileCriterion[]): string | null {
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

export function positionLabel(comparison: BankComparison, institutionId: string): string {
  const index = comparison.reviewed.findIndex((score) => score.institutionId === institutionId);
  const score = comparison.reviewed[index];
  return score === undefined || score.score === null
    ? t.reviewed.noPosition
    : interpolate(t.candidates.rank, "{rank}", String(index + 1));
}

export function bankTag(comparison: BankComparison, institutionId: string): string | null {
  if (comparison.current.some((score) => score.institutionId === institutionId)) {
    return t.reviewed.current;
  }
  return comparison.candidates.some((score) => score.institutionId === institutionId)
    ? t.reviewed.candidate
    : null;
}

function reviewedRows(
  comparison: BankComparison,
  overrides: readonly StoredOverride[],
  today: string,
): ReviewedBankRow[] {
  const overriddenIds = new Set(overrides.map((override) => override.institutionId));
  return comparison.reviewed.map((score) => ({
    institutionId: score.institutionId,
    href: bankHref(score.institutionId),
    positionLabel: positionLabel(comparison, score.institutionId),
    name: institutionName(score.institutionId),
    tag: bankTag(comparison, score.institutionId),
    overriddenLabel: overriddenIds.has(score.institutionId) ? t.reviewed.overridden : null,
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
    href: bankHref(candidate.institutionId),
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

export function outdatedOverrides(overrides: readonly StoredOverride[]): StoredOverride[] {
  return overrides.filter((override) => {
    const reviewedAt = referenceProfileOf(override.institutionId)?.criteria[override.criterion]
      .reviewedAt;
    return (
      reviewedAt !== undefined && referenceRevisedSinceOverride(reviewedAt, override.baseReviewedAt)
    );
  });
}

function overridesNotice(overrides: readonly StoredOverride[]): string | null {
  const outdated = outdatedOverrides(overrides);
  if (outdated.length === 0) return null;
  const banks = [...new Set(outdated.map((override) => institutionName(override.institutionId)))];
  return outdated.length === 1
    ? interpolate(t.overridesNotice.one, "{banks}", banks.join(", "))
    : interpolateAll(t.overridesNotice.many, {
        count: String(outdated.length),
        banks: banks.join(", "),
      });
}

export type HouseholdBankComparison = {
  today: string;
  timeZone: string;
  stored: HouseholdComparisonSettings;
  institutions: HouseholdInstitutions;
  overrides: StoredOverride[];
  comparison: BankComparison;
};

// The household's comparison runs over the shipped profiles with its own
// corrections applied (ADR-0006, 2026-10-14), so the Bancos page, a bank's
// own page and the analyst's facts all see the same scores.
export async function loadHouseholdBankComparison(
  scope: HouseholdScope,
  now: Date,
): Promise<HouseholdBankComparison> {
  const db = getDb();
  const [settings, stored, institutions, overrides] = await Promise.all([
    getHouseholdSettings(scope, db),
    getHouseholdCriteriaWeights(scope, db),
    getHouseholdInstitutions(scope, db),
    getHouseholdOverrides(scope, db),
  ]);
  const comparison = compareBanks({
    profiles: applyScoreOverrides(BANK_PROFILES, overrides),
    levels: stored.levels,
    currentInstitutionIds: institutions.institutionIds,
    settings: stored.options,
  });
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  return {
    today: localDateOf(now, timeZone),
    timeZone,
    stored,
    institutions,
    overrides,
    comparison,
  };
}

export async function buildBanksPageProps(
  scope: HouseholdScope,
  options: { now: Date; canManage: boolean },
): Promise<BanksPageProps> {
  const { canManage } = options;
  const { today, stored, institutions, overrides, comparison } = await loadHouseholdBankComparison(
    scope,
    options.now,
  );
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
    overridesNotice: overridesNotice(overrides),
    candidates: comparison.candidates.map((candidate, index) =>
      candidateView(
        candidate,
        index,
        comparison.baseline,
        stored.options.proConMinDifference,
        today,
      ),
    ),
    reviewed: reviewedRows(comparison, overrides, today),
  };
}
