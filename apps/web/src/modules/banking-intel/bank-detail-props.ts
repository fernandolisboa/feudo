import {
  ACCOUNT_TYPES,
  BANK_PROFILE_CRITERIA,
  referenceRevisedSinceOverride,
  type AccountType,
  type AccountTypeStatus,
  type BankProfileCriterion,
} from "@feudo/core";
import {
  institutionById,
  type BankProfileAccountTypeEntry,
  type BankProfileCriterionEntry,
  type Citation,
  type Institution,
} from "@feudo/core/reference-data";

import {
  canManageHouseholdSettings,
  getViewerRole,
  householdScope,
  type HouseholdScope,
  type HouseholdSession,
} from "@/modules/households";

import { formatIsoDate, formatShortDate } from "@/lib/format-date";
import { interpolate, interpolateAll } from "@/lib/interpolate";
import { getDb } from "@/platform/db/client";
import { referenceProfileOf } from "./bank-profiles";
import {
  accountTypeLabel,
  bankTag,
  criterionLabel,
  loadHouseholdBankComparison,
  positionLabel,
  reviewView,
  scoreLabel,
  unmetLabel,
  weightViews,
  type ReviewView,
} from "./page-props";
import { t } from "./strings";
import type { StoredAccountTypeOverride, StoredOverride } from "./validation";

export type StatView = { label: string; value: string; meta: string | null };

export type SourceView = { url: string; host: string; label: string };

export type OverrideView = {
  scoreLabel: string;
  summary: string;
  sourceUrl: string | null;
  outdatedHint: string | null;
};

export type OverrideFormDefaults = { score: number | null; note: string; sourceUrl: string };

export type CriterionDetailView = {
  criterion: BankProfileCriterion;
  label: string;
  help: string;
  weightLabel: string;
  scored: boolean;
  scoreLabel: string;
  referenceScoreLabel: string;
  summary: string;
  sources: SourceView[];
  review: ReviewView;
  referenceReviewedAt: string;
  override: OverrideView | null;
  formDefaults: OverrideFormDefaults;
};

export type AccountTypeOverrideView = {
  statusLabel: string;
  summary: string;
  sourceUrl: string | null;
  outdatedHint: string | null;
};

export type AccountTypeOverrideFormDefaults = {
  offered: boolean | null;
  note: string;
  sourceUrl: string;
};

export type AccountTypeDetailView = {
  type: AccountType;
  label: string;
  statusLabel: string;
  referenceStatusLabel: string;
  condition: string | null;
  summary: string;
  sources: SourceView[];
  review: ReviewView;
  referenceReviewedAt: string;
  override: AccountTypeOverrideView | null;
  formDefaults: AccountTypeOverrideFormDefaults;
};

export type BankDetailPageProps = {
  institutionId: string;
  name: string;
  tag: string | null;
  unmetLabel: string | null;
  stats: StatView[];
  paymentInstitutionNotice: string | null;
  canManage: boolean;
  criteria: CriterionDetailView[];
  accountTypes: AccountTypeDetailView[];
};

function guaranteeStat(institution: Institution): StatView {
  const guarantee = institution.depositGuarantee;
  switch (guarantee.fund) {
    case "FGC":
      return {
        label: t.detail.guarantee,
        value: t.detail.guaranteeFgc,
        meta: interpolate(t.detail.guaranteeFgcMeta, "{name}", guarantee.conglomerate.name),
      };
    case "FGCoop":
      return {
        label: t.detail.guarantee,
        value: t.detail.guaranteeFgcoop,
        meta: t.detail.guaranteeFgcoopMeta,
      };
  }
}

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

function sourceView(citation: Citation): SourceView {
  return {
    url: citation.url,
    host: hostOf(citation.url),
    label: `${citation.kind === "primary" ? t.detail.primary : t.detail.secondary} · ${interpolate(
      t.detail.checkedAt,
      "{date}",
      formatIsoDate(citation.checkedAt),
    )}`,
  };
}

function referenceScoreOf(entry: BankProfileCriterionEntry): number | null {
  return entry.status === "scored" ? entry.score : null;
}

function overrideView(
  criterion: BankProfileCriterion,
  entry: BankProfileCriterionEntry,
  override: StoredOverride,
  timeZone: string,
): OverrideView {
  return {
    scoreLabel: String(override.score),
    summary: interpolateAll(t.detail.householdNote, {
      score: String(override.score),
      date: formatShortDate(override.updatedAt, timeZone),
      note: override.note,
    }),
    sourceUrl: override.sourceUrl,
    outdatedHint: referenceRevisedSinceOverride(entry.reviewedAt, override.baseReviewedAt)
      ? interpolateAll(t.detail.outdated, {
          criterion: criterionLabel(criterion),
          date: formatIsoDate(entry.reviewedAt),
          score: scoreLabel(referenceScoreOf(entry)),
        })
      : null,
  };
}

function accountTypeStatusLabel(status: AccountTypeStatus): string {
  switch (status) {
    case "offered":
      return t.accountTypes.status.offered;
    case "not-offered":
      return t.accountTypes.status.notOffered;
    case "not-found":
      return t.accountTypes.status.notFound;
  }
}

function accountTypeOverrideView(
  type: AccountType,
  entry: BankProfileAccountTypeEntry,
  override: StoredAccountTypeOverride,
  timeZone: string,
): AccountTypeOverrideView {
  const statusLabel = override.offered
    ? t.accountTypes.status.offered
    : t.accountTypes.status.notOffered;
  return {
    statusLabel,
    summary: interpolateAll(t.accountTypes.householdNote, {
      status: statusLabel,
      date: formatShortDate(override.updatedAt, timeZone),
      note: override.note,
    }),
    sourceUrl: override.sourceUrl,
    outdatedHint: referenceRevisedSinceOverride(entry.reviewedAt, override.baseReviewedAt)
      ? interpolateAll(t.accountTypes.outdated, {
          type: accountTypeLabel(type),
          date: formatIsoDate(entry.reviewedAt),
          status: accountTypeStatusLabel(entry.status),
        })
      : null,
  };
}

function accountTypeFormOffered(status: AccountTypeStatus): boolean | null {
  switch (status) {
    case "offered":
      return true;
    case "not-offered":
      return false;
    case "not-found":
      return null;
  }
}

// A bank's own page (ADR-0006): the reference evidence for every criterion
// and every account type with their sources and review date, the
// household's corrections on top, and the same score, place and unmet
// account types the Bancos page shows. Returns null for an institution
// Feudo has no profile for, so the route can 404.
export async function getBankDetailPageProps(
  session: HouseholdSession,
  institutionId: string,
  now: Date = new Date(),
): Promise<BankDetailPageProps | null> {
  if (institutionById(institutionId) === undefined) return null;
  const viewerRole = await getViewerRole(session, getDb());
  return buildBankDetailPageProps(householdScope(session), institutionId, {
    now,
    canManage: canManageHouseholdSettings(viewerRole),
  });
}

async function buildBankDetailPageProps(
  scope: HouseholdScope,
  institutionId: string,
  options: { now: Date; canManage: boolean },
): Promise<BankDetailPageProps | null> {
  const institution = institutionById(institutionId);
  const reference = referenceProfileOf(institutionId);
  if (institution === undefined || reference === undefined) return null;

  const { today, timeZone, stored, overrides, accountTypeOverrides, profiles, comparison } =
    await loadHouseholdBankComparison(scope, options.now);
  const score = comparison.reviewed.find((entry) => entry.institutionId === institutionId);
  const weights = new Map(weightViews(stored.levels).map((view) => [view.criterion, view]));
  const ownOverrides = new Map(
    overrides
      .filter((override) => override.institutionId === institutionId)
      .map((override) => [override.criterion, override]),
  );
  const ownAccountTypeOverrides = new Map(
    accountTypeOverrides
      .filter((override) => override.institutionId === institutionId)
      .map((override) => [override.accountType, override]),
  );
  const corrected = profiles.find((profile) => profile.institutionId === institutionId);

  return {
    institutionId,
    name: institution.name,
    tag: bankTag(comparison, institutionId),
    unmetLabel: unmetLabel(score?.unmetRequirements ?? []),
    stats: [
      {
        label: t.detail.score,
        value: scoreLabel(score?.score ?? null),
        meta: t.detail.scoreMeta,
      },
      {
        label: t.detail.position,
        value: positionLabel(comparison, institutionId),
        meta: interpolate(t.detail.positionMeta, "{count}", String(comparison.reviewed.length)),
      },
      guaranteeStat(institution),
    ],
    paymentInstitutionNotice:
      institution.accountHolder.kind === "payment-institution" ? t.detail.paymentInstitution : null,
    canManage: options.canManage,
    criteria: BANK_PROFILE_CRITERIA.map((criterion) => {
      const entry = reference.criteria[criterion];
      const weight = weights.get(criterion);
      const override = ownOverrides.get(criterion);
      const referenceScoreLabel = scoreLabel(referenceScoreOf(entry));
      return {
        criterion,
        label: t.criteria[criterion].label,
        help: t.criteria[criterion].help,
        weightLabel: interpolateAll(t.detail.weight, {
          level: weight?.levelLabel ?? "",
          share: String(weight?.share ?? 0),
        }),
        scored: override !== undefined || entry.status === "scored",
        scoreLabel: override ? String(override.score) : referenceScoreLabel,
        referenceScoreLabel,
        summary: entry.summaryPtBr,
        sources: (entry.citations ?? []).map(sourceView),
        review: reviewView(entry.reviewedAt, today),
        referenceReviewedAt: entry.reviewedAt,
        override: override ? overrideView(criterion, entry, override, timeZone) : null,
        formDefaults: override
          ? { score: override.score, note: override.note, sourceUrl: override.sourceUrl ?? "" }
          : { score: referenceScoreOf(entry), note: "", sourceUrl: "" },
      };
    }),
    accountTypes: ACCOUNT_TYPES.map((type) => {
      const entry = reference.accountTypes[type];
      const override = ownAccountTypeOverrides.get(type);
      const referenceStatusLabel = accountTypeStatusLabel(entry.status);
      const correctedStatus = corrected?.accountTypes[type] ?? entry.status;
      return {
        type,
        label: accountTypeLabel(type),
        statusLabel: accountTypeStatusLabel(correctedStatus),
        referenceStatusLabel,
        condition: entry.conditionPtBr ?? null,
        summary: entry.summaryPtBr,
        sources: (entry.citations ?? []).map(sourceView),
        review: reviewView(entry.reviewedAt, today),
        referenceReviewedAt: entry.reviewedAt,
        override: override ? accountTypeOverrideView(type, entry, override, timeZone) : null,
        formDefaults: override
          ? { offered: override.offered, note: override.note, sourceUrl: override.sourceUrl ?? "" }
          : { offered: accountTypeFormOffered(entry.status), note: "", sourceUrl: "" },
      };
    }),
  };
}
