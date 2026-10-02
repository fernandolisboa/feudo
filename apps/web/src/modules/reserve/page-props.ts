import {
  averageFixedCost,
  computeReserveCoverage,
  computeReserveTarget,
  DEFAULT_RESERVE_MULTIPLE,
  formatMoney,
  formatYearMonth,
  HOUSEHOLD_CURRENCY,
  localDateOf,
  yearMonthOf,
  type AverageFixedCostMonth,
  type ReserveCoverage,
  type ReserveMarketRates,
  type ReserveTarget,
  type YearMonth,
} from "@feudo/core";

import {
  canManageHouseholdSettings,
  DEFAULT_TIME_ZONE,
  getHouseholdSettings,
  getViewerRole,
  householdScope,
  type HouseholdScope,
  type HouseholdSession,
} from "@/modules/households";
import { householdHasAccounts, readHouseholdDashboardLines } from "@/modules/ledger";
import { getLatestIndicators, type LatestIndicators } from "@/modules/market-data";

import { interpolate, interpolateAll } from "@/lib/interpolate";
import { getDb, type Database } from "@/platform/db/client";
import type { StatTileView } from "@/ui/stat-tile";
import {
  buildCoverageView,
  buildPlacementViews,
  INSTITUTION_OPTIONS,
  type InstitutionOption,
  type PlacementRankingView,
  type ReserveCoverageView,
  type ReservePositionView,
} from "./placement-views";
import {
  createReserveMarkRepository,
  createReserveTargetNoticeRepository,
  type ReservePositionRow,
} from "./repository";
import { t } from "./strings";

export type { StatTileView };
export type {
  ExcludedPlacementView,
  InstitutionOption,
  PlacementRankingView,
  PlacementRowView,
  ReserveCoverageView,
  ReserveMarkEdit,
  ReservePositionView,
} from "./placement-views";

export type MonthlyFixedCostRow = { monthLabel: string; amountLabel: string | null };

export type ReserveNoticeView = { id: string; message: string };

export type ReservePageProps = {
  monthLabel: string;
  multiple: number;
  canManage: boolean;
  hasAccounts: boolean;
  hasHistory: boolean;
  headline: string;
  tiles: {
    target: StatTileView;
    averageFixedCost: StatTileView;
    currentReserve: StatTileView;
    coverage: StatTileView;
  } | null;
  coverage: ReserveCoverageView | null;
  monthlyFixedCosts: MonthlyFixedCostRow[];
  notice: ReserveNoticeView | null;
  positions: ReservePositionView[];
  ranking: PlacementRankingView | null;
  institutionOptions: InstitutionOption[];
};

function joinMonthLabels(months: readonly YearMonth[]): string {
  const labels = months.map(formatYearMonth);
  if (labels.length <= 1) {
    return labels[0] ?? "";
  }
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1] ?? ""}`;
}

function targetTile(target: ReserveTarget): StatTileView {
  return {
    label: t.tiles.target,
    value: formatMoney({ amountCentavos: target.targetCentavos, currency: HOUSEHOLD_CURRENCY }),
    meta: interpolate(t.tiles.targetMeta, "{multiple}", String(target.multiple)),
  };
}

function averageFixedCostTile(
  target: ReserveTarget,
  monthsUsed: readonly YearMonth[],
): StatTileView {
  const value = formatMoney({
    amountCentavos: target.averageFixedCostCentavos,
    currency: HOUSEHOLD_CURRENCY,
  });
  if (target.isEstimate) {
    return {
      label: t.tiles.averageFixedCost,
      value,
      meta: interpolate(t.tiles.averageFixedCostEstimate, "{months}", joinMonthLabels(monthsUsed)),
    };
  }
  if (target.monthsUsedCount === 6) {
    return { label: t.tiles.averageFixedCost, value, meta: t.tiles.averageFixedCostFull };
  }
  return {
    label: t.tiles.averageFixedCost,
    value,
    meta: interpolate(t.tiles.averageFixedCostPartial, "{months}", joinMonthLabels(monthsUsed)),
  };
}

function currentReserveTile(coverage: ReserveCoverage, reserveCount: number): StatTileView {
  if (reserveCount === 0) {
    return { label: t.tiles.currentReserve, value: "—", meta: t.tiles.currentReserveMeta };
  }
  return {
    label: t.tiles.currentReserve,
    value: formatMoney({ amountCentavos: coverage.currentCentavos, currency: HOUSEHOLD_CURRENCY }),
    meta:
      reserveCount === 1
        ? t.tiles.currentReserveOne
        : interpolate(t.tiles.currentReserveCount, "{count}", String(reserveCount)),
  };
}

function coverageTile(view: ReserveCoverageView, reserveCount: number): StatTileView {
  if (reserveCount === 0 || view.percentLabel === null) {
    return { label: t.tiles.coverage, value: "—", meta: t.tiles.coverageMeta };
  }
  return { label: t.tiles.coverage, value: view.percentLabel, meta: view.monthsLabel };
}

function marketRates(indicators: LatestIndicators): ReserveMarketRates {
  return {
    cdiAnnualPpm: indicators.cdiAnnual?.ratePpm ?? null,
    selicAnnualPpm: indicators.selicAnnual?.ratePpm ?? null,
    selicTargetPpm: indicators.selicTarget?.ratePpm ?? null,
    ipca12MonthPpm: indicators.ipca12Month?.ratePpm ?? null,
  };
}

function monthlyFixedCostRows(months: readonly AverageFixedCostMonth[]): MonthlyFixedCostRow[] {
  return months.map((entry) => ({
    monthLabel: formatYearMonth(entry.month),
    amountLabel:
      entry.fixedCentavos === null
        ? null
        : formatMoney({ amountCentavos: entry.fixedCentavos, currency: HOUSEHOLD_CURRENCY }),
  }));
}

function headlineFor(target: ReserveTarget): string {
  const amount = formatMoney({
    amountCentavos: target.targetCentavos,
    currency: HOUSEHOLD_CURRENCY,
  });
  return target.isEstimate
    ? interpolate(t.headline.estimate, "{amount}", amount)
    : interpolate(t.headline.target, "{amount}", amount);
}

async function noticeView(scope: HouseholdScope, db: Database): Promise<ReserveNoticeView | null> {
  const notice = await createReserveTargetNoticeRepository(scope).getUndismissed(db);
  if (!notice) return null;
  return {
    id: notice.id,
    message: interpolateAll(t.notice.message, {
      from: formatMoney({
        amountCentavos: notice.previousTargetCentavos,
        currency: HOUSEHOLD_CURRENCY,
      }),
      to: formatMoney({ amountCentavos: notice.newTargetCentavos, currency: HOUSEHOLD_CURRENCY }),
      month: formatYearMonth(notice.closedMonth),
    }),
  };
}

export type ReserveNoticeBannerProps = { message: string } | null;

// The compact notice rendered at the top of Visão geral (point 8 of the
// ticket): the ledger slice composes this, never importing the reserve
// slice itself, so the dependency only ever runs app -> reserve, app ->
// ledger, never ledger -> reserve.
export async function getReserveNoticeBannerProps(
  session: HouseholdSession,
): Promise<ReserveNoticeBannerProps> {
  const db = getDb();
  const notice = await noticeView(householdScope(session), db);
  return notice ? { message: notice.message } : null;
}

// Everything the Reserva page renders, so the page stays a composition of
// this slice's components (ADR-0011). Reads LIVE numbers through the same
// window and the same read path the month-close job and the Visão geral
// tile use (readHouseholdDashboardLines, packages/core's averageFixedCost),
// so the three can never disagree; the recorded table only backs the
// notice, never the numbers shown here.
export async function getReservePageProps(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<ReservePageProps> {
  const db = getDb();
  const scope = householdScope(session);

  const [settings, hasAccounts, notice, viewerRole] = await Promise.all([
    getHouseholdSettings(scope, db),
    householdHasAccounts(db, scope),
    noticeView(scope, db),
    getViewerRole(session, db),
  ]);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;
  const multiple = settings?.reserveMultiple ?? DEFAULT_RESERVE_MULTIPLE;
  const month = yearMonthOf(now, timeZone);
  const canManage = canManageHouseholdSettings(viewerRole);
  const base = {
    monthLabel: formatYearMonth(month),
    multiple,
    canManage,
    hasAccounts,
    notice,
    institutionOptions: INSTITUTION_OPTIONS,
  };

  if (!hasAccounts) {
    return {
      ...base,
      hasHistory: false,
      headline: t.headline.noAccounts,
      tiles: null,
      coverage: null,
      monthlyFixedCosts: [],
      positions: [],
      ranking: null,
    };
  }

  const [{ lines }, positionRows, indicators] = await Promise.all([
    readHouseholdDashboardLines(db, scope, month, timeZone),
    createReserveMarkRepository(scope).listPositions(db),
    getLatestIndicators(db),
  ]);
  const { positions, ranking } = buildPlacementViews(
    positionRows,
    marketRates(indicators),
    localDateOf(now, timeZone),
  );
  const detail = averageFixedCost({ month, lines });
  const monthlyFixedCosts = monthlyFixedCostRows(detail.months);

  if (detail.average === null) {
    return {
      ...base,
      hasHistory: false,
      headline: t.headline.noHistory,
      tiles: null,
      coverage: null,
      monthlyFixedCosts,
      positions,
      ranking,
    };
  }

  const target = computeReserveTarget(detail.average, multiple);
  const reserveRows = positionRows.filter(
    (row: ReservePositionRow) => row.isReserve && row.currency === HOUSEHOLD_CURRENCY,
  );
  const coverage = computeReserveCoverage({
    reservePositions: reserveRows,
    targetCentavos: target.targetCentavos,
    averageFixedCostCentavos: target.averageFixedCostCentavos,
  });
  const coverageView = buildCoverageView(coverage, target.targetCentavos);

  return {
    ...base,
    hasHistory: true,
    headline: headlineFor(target),
    tiles: {
      target: targetTile(target),
      averageFixedCost: averageFixedCostTile(target, detail.average.monthsUsed),
      currentReserve: currentReserveTile(coverage, reserveRows.length),
      coverage: coverageTile(coverageView, reserveRows.length),
    },
    coverage: reserveRows.length === 0 || target.targetCentavos <= 0 ? null : coverageView,
    monthlyFixedCosts,
    positions,
    ranking,
  };
}
