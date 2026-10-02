import {
  BANK_PROFILE_CRITERIA,
  compareBanks,
  localDateOf,
  type BankCandidate,
  type BankProfileCriterion,
  type BankScore,
  type CriteriaWeights,
  type CriterionComparison,
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
import { getHouseholdCriteriaWeights, getHouseholdInstitutions } from "./service";
import { t } from "./strings";

export type CriterionWeightView = {
  criterion: BankProfileCriterion;
  label: string;
  help: string;
  weight: number;
  levelLabel: string;
};

export type ReviewView = { label: string; stale: boolean };

export type CurrentBankRow = {
  institutionId: string;
  name: string;
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
  hasAccounts: boolean;
  currentRows: CurrentBankRow[];
  baselineNotice: string | null;
  unrecognizedNotice: string | null;
  candidates: CandidateView[];
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

function weightViews(weights: CriteriaWeights): CriterionWeightView[] {
  return BANK_PROFILE_CRITERIA.map((criterion) => ({
    criterion,
    label: t.criteria[criterion].label,
    help: t.criteria[criterion].help,
    weight: weights[criterion],
    levelLabel: t.weights.levels[weights[criterion]] ?? String(weights[criterion]),
  }));
}

function currentRow(score: BankScore, today: string): CurrentBankRow {
  return {
    institutionId: score.institutionId,
    name: institutionName(score.institutionId),
    scoreLabel: scoreLabel(score.score),
    review: reviewView(score.reviewedAt, today),
  };
}

function candidateView(
  candidate: BankCandidate,
  index: number,
  baseline: "current" | "median",
  today: string,
): CandidateView {
  return {
    institutionId: candidate.institutionId,
    rankLabel: interpolate(t.candidates.rank, "{rank}", String(index + 1)),
    name: institutionName(candidate.institutionId),
    scoreLabel: scoreLabel(candidate.score),
    review: reviewView(candidate.reviewedAt, today),
    pros: candidate.pros.map(comparisonLine),
    cons: candidate.cons.map(comparisonLine),
    emptyPros: baseline === "current" ? t.candidates.noPros : t.candidates.noProsMedian,
    emptyCons: baseline === "current" ? t.candidates.noCons : t.candidates.noConsMedian,
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

  const [settings, weights, institutions] = await Promise.all([
    getHouseholdSettings(scope, db),
    getHouseholdCriteriaWeights(scope, db),
    getHouseholdInstitutions(scope, db),
  ]);
  const today = localDateOf(now, settings?.timeZone ?? DEFAULT_TIME_ZONE);

  const comparison = compareBanks({
    profiles: BANK_PROFILES,
    weights: weights.weights,
    currentInstitutionIds: institutions.institutionIds,
  });
  const [top] = comparison.candidates;

  return {
    headline: top
      ? interpolate(t.headline.candidate, "{bank}", institutionName(top.institutionId))
      : t.headline.noCandidate,
    canManage,
    weightsAreCustom: weights.isCustom,
    weights: weightViews(weights.weights),
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
      candidateView(candidate, index, comparison.baseline, today),
    ),
  };
}
