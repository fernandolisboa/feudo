import {
  accountTypeRequirementsOf,
  applyAccountTypeOverrides,
  applyScoreOverrides,
  BANK_PROFILE_CRITERIA,
  compareBanks,
  criterionShares,
  localDateOf,
  referenceRevisedSinceOverride,
  type AccountType,
  type AccountTypeFilter,
  type AccountTypeRequirement,
  type AccountTypeStatus,
  type BankCandidate,
  type BankComparison,
  type BankProfileCriterion,
  type BankScore,
  type CriterionComparison,
  type CriterionNumericWeight,
  type ScorableBankProfile,
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
import { BANK_PROFILES, referenceProfileOf, scorableProfiles } from "./bank-profiles";
import { levelLabel } from "./level-label";
import {
  getHouseholdAccountTypeOverrides,
  getHouseholdCriteriaWeights,
  getHouseholdInstitutions,
  getHouseholdOverrides,
  type HouseholdComparisonSettings,
  type HouseholdInstitutions,
} from "./service";
import { t } from "./strings";
import type { StoredAccountTypeOverride, StoredOverride } from "./validation";

export type CriterionWeightView = {
  criterion: BankProfileCriterion;
  label: string;
  help: string;
  level: CriterionNumericWeight;
  levelLabel: string;
  share: number;
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
  offeredTypesLine: string | null;
  score: number | null;
  scoreLabel: string;
  review: ReviewView;
};

export type CandidateView = {
  institutionId: string;
  href: string;
  rankLabel: string;
  name: string;
  score: number | null;
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
  accountTypeFilter: AccountTypeFilter;
  accountTypeFilterSummary: string;
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

function institutionName(institutionId: string): string {
  return institutionById(institutionId)?.name ?? institutionId;
}

export function criterionLabel(criterion: BankProfileCriterion): string {
  return t.criteria[criterion].label;
}

export function accountTypeLabel(type: AccountType): string {
  return t.accountTypes.types[type].label;
}

function accountTypeShortLabel(type: AccountType): string {
  return t.accountTypes.types[type].shortLabel;
}

export function requirementLabel(requirement: AccountTypeRequirement): string {
  return t.accountTypes.requirementLabel[requirement];
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

export function weightViews(levels: WeightLevels): CriterionWeightView[] {
  const shares = criterionShares(levels);
  return BANK_PROFILE_CRITERIA.map((criterion) => {
    const level = levels[criterion];
    return {
      criterion,
      label: t.criteria[criterion].label,
      help: t.criteria[criterion].help,
      level,
      levelLabel: levelLabel(level),
      share: shares[criterion],
    };
  });
}

export function unmetLabel(unmetRequirements: readonly AccountTypeRequirement[]): string | null {
  return unmetRequirements.length === 0
    ? null
    : interpolate(
        t.reviewed.unmet,
        "{types}",
        unmetRequirements.map((requirement) => t.accountTypes.unmetLabel[requirement]).join(", "),
      );
}

// Brazilian Portuguese list grammar: a comma between every item but the
// last, "e" only before the last one ("A, B e C"), not "e" repeated between
// every pair.
function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  const rest = items.slice(0, -1).join(", ");
  const last = items[items.length - 1] ?? "";
  return `${rest} ${t.accountTypes.summary.and} ${last}`;
}

// What the household's filter requires, in plain words, for the summary
// sentence above the candidates ("Mostrando 9 de 13 bancos: os que têm
// conta conjunta e conta MEI.") and for the analyst's facts.
export function accountTypeFilterSummary(
  filter: AccountTypeFilter,
  total: number,
  meeting: number,
): string {
  const requirements = accountTypeRequirementsOf(filter);
  if (requirements.length === 0) {
    return interpolate(t.accountTypes.summary.all, "{total}", String(total));
  }
  const types = joinWithAnd(requirements.map(requirementLabel));
  return interpolateAll(t.accountTypes.summary.filtered, {
    meeting: String(meeting),
    total: String(total),
    types,
  });
}

type AccountTypeStatusEntry = { status: AccountTypeStatus; conditionPtBr?: string };
type AccountTypeStatusMap = Readonly<Record<AccountType, AccountTypeStatusEntry>>;

// The reference account types with the household's own corrections already
// applied (loadHouseholdBankComparison runs applyAccountTypeOverrides once,
// before compareBanks), for the bank page and the short "what it offers"
// line on the reviewed table; the condition chip always comes from the
// reference data, since a correction carries no condition of its own.
export function householdAccountTypes(
  institutionId: string,
  profiles: readonly ScorableBankProfile[],
): AccountTypeStatusMap | null {
  const reference = referenceProfileOf(institutionId);
  const corrected = profiles.find((profile) => profile.institutionId === institutionId);
  if (reference === undefined || corrected === undefined) return null;
  return Object.fromEntries(
    (Object.keys(reference.accountTypes) as AccountType[]).map((type) => [
      type,
      {
        status: corrected.accountTypes[type],
        conditionPtBr: reference.accountTypes[type].conditionPtBr,
      },
    ]),
  ) as AccountTypeStatusMap;
}

export function offeredAccountTypesLine(statuses: AccountTypeStatusMap | null): string | null {
  if (statuses === null) return null;
  const parts = (Object.keys(statuses) as AccountType[])
    .filter((type) => statuses[type].status === "offered")
    .map((type) => {
      const condition = statuses[type].conditionPtBr;
      const label = accountTypeShortLabel(type);
      return condition ? `${label} (${condition})` : label;
    });
  return parts.length === 0 ? null : parts.join(" · ");
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

function correctedItemsLabel(
  criteria: readonly string[] | undefined,
  types: readonly string[] | undefined,
): string | null {
  const items = [...(criteria ?? []), ...(types ?? [])];
  return items.length === 0
    ? null
    : interpolate(t.reviewed.overridden, "{items}", items.join(", "));
}

function reviewedRows(
  comparison: BankComparison,
  overrides: readonly StoredOverride[],
  accountTypeOverrides: readonly StoredAccountTypeOverride[],
  profiles: readonly ScorableBankProfile[],
  today: string,
): ReviewedBankRow[] {
  const correctedCriteria = new Map<string, string[]>();
  for (const override of overrides) {
    const labels = correctedCriteria.get(override.institutionId) ?? [];
    correctedCriteria.set(override.institutionId, [...labels, criterionLabel(override.criterion)]);
  }
  const correctedTypes = new Map<string, string[]>();
  for (const override of accountTypeOverrides) {
    const labels = correctedTypes.get(override.institutionId) ?? [];
    correctedTypes.set(override.institutionId, [...labels, accountTypeLabel(override.accountType)]);
  }
  return comparison.reviewed.map((score) => ({
    institutionId: score.institutionId,
    href: bankHref(score.institutionId),
    positionLabel: positionLabel(comparison, score.institutionId),
    name: institutionName(score.institutionId),
    tag: bankTag(comparison, score.institutionId),
    overriddenLabel: correctedItemsLabel(
      correctedCriteria.get(score.institutionId),
      correctedTypes.get(score.institutionId),
    ),
    unmetLabel: unmetLabel(score.unmetRequirements),
    offeredTypesLine: offeredAccountTypesLine(householdAccountTypes(score.institutionId, profiles)),
    score: score.score,
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
    score: candidate.score,
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
// and the household's own weights and account-type filter (ADR-0006); this
// only turns them into text.
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

function outdatedOverrides(overrides: readonly StoredOverride[]): StoredOverride[] {
  return overrides.filter((override) => {
    const reviewedAt = referenceProfileOf(override.institutionId)?.criteria[override.criterion]
      .reviewedAt;
    return (
      reviewedAt !== undefined && referenceRevisedSinceOverride(reviewedAt, override.baseReviewedAt)
    );
  });
}

function outdatedAccountTypeOverrides(
  overrides: readonly StoredAccountTypeOverride[],
): StoredAccountTypeOverride[] {
  return overrides.filter((override) => {
    const reviewedAt = referenceProfileOf(override.institutionId)?.accountTypes[
      override.accountType
    ].reviewedAt;
    return (
      reviewedAt !== undefined && referenceRevisedSinceOverride(reviewedAt, override.baseReviewedAt)
    );
  });
}

function overridesNotice(
  overrides: readonly StoredOverride[],
  accountTypeOverrides: readonly StoredAccountTypeOverride[],
): string | null {
  const outdated = outdatedOverrides(overrides);
  const outdatedTypes = outdatedAccountTypeOverrides(accountTypeOverrides);
  const total = outdated.length + outdatedTypes.length;
  if (total === 0) return null;
  const banks = [
    ...new Set([
      ...outdated.map((override) => institutionName(override.institutionId)),
      ...outdatedTypes.map((override) => institutionName(override.institutionId)),
    ]),
  ];
  return total === 1
    ? interpolate(t.overridesNotice.one, "{banks}", banks.join(", "))
    : interpolateAll(t.overridesNotice.many, { count: String(total), banks: banks.join(", ") });
}

export type HouseholdBankComparison = {
  today: string;
  timeZone: string;
  stored: HouseholdComparisonSettings;
  institutions: HouseholdInstitutions;
  overrides: StoredOverride[];
  accountTypeOverrides: StoredAccountTypeOverride[];
  profiles: readonly ScorableBankProfile[];
  comparison: BankComparison;
};

// The household's comparison runs over the shipped profiles with its own
// corrections applied (ADR-0006), so the Bancos page, a bank's own page and
// the analyst's facts all see the same scores and account-type statuses.
export async function loadHouseholdBankComparison(
  scope: HouseholdScope,
  now: Date,
): Promise<HouseholdBankComparison> {
  const db = getDb();
  const [settings, stored, institutions, overrides, accountTypeOverrides] = await Promise.all([
    getHouseholdSettings(scope, db),
    getHouseholdCriteriaWeights(scope, db),
    getHouseholdInstitutions(scope, db),
    getHouseholdOverrides(scope, db),
    getHouseholdAccountTypeOverrides(scope, db),
  ]);
  const profiles = applyAccountTypeOverrides(
    applyScoreOverrides(scorableProfiles(BANK_PROFILES), overrides),
    accountTypeOverrides.map((override) => ({
      institutionId: override.institutionId,
      accountType: override.accountType,
      offered: override.offered,
    })),
  );
  const comparison = compareBanks({
    profiles,
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
    accountTypeOverrides,
    profiles,
    comparison,
  };
}

export async function buildBanksPageProps(
  scope: HouseholdScope,
  options: { now: Date; canManage: boolean },
): Promise<BanksPageProps> {
  const { canManage } = options;
  const { today, stored, institutions, overrides, accountTypeOverrides, profiles, comparison } =
    await loadHouseholdBankComparison(scope, options.now);
  const [top] = comparison.candidates;
  const meeting = comparison.reviewed.filter(
    (score) => score.unmetRequirements.length === 0,
  ).length;

  return {
    headline: comparison.noneMeetsRequirements
      ? t.headline.noneMeetsRequirements
      : top
        ? interpolate(t.headline.candidate, "{bank}", institutionName(top.institutionId))
        : t.headline.noCandidate,
    canManage,
    weightsAreCustom: stored.isCustom,
    weights: weightViews(stored.levels),
    options: {
      candidateCount: stored.options.candidateCount,
      proConMinDifference: stored.options.proConMinDifference,
    },
    accountTypeFilter: stored.options.accountTypeFilter,
    accountTypeFilterSummary: accountTypeFilterSummary(
      stored.options.accountTypeFilter,
      comparison.reviewed.length,
      meeting,
    ),
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
    overridesNotice: overridesNotice(overrides, accountTypeOverrides),
    candidates: comparison.candidates.map((candidate, index) =>
      candidateView(
        candidate,
        index,
        comparison.baseline,
        stored.options.proConMinDifference,
        today,
      ),
    ),
    reviewed: reviewedRows(comparison, overrides, accountTypeOverrides, profiles, today),
  };
}
