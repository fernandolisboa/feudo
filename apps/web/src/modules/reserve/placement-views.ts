import {
  formatBasisPointsPercent,
  formatMoney,
  HOUSEHOLD_CURRENCY,
  rankReservePlacements,
  RESERVE_PRODUCTS,
  reservePositionAdvice,
  type ExclusionReason,
  type PlacementEvaluation,
  type PositionGuarantee,
  type PositionLiquidity,
  type PositionTax,
  type RatePpm,
  type ReserveCoverage,
  type ReserveMarketRates,
} from "@feudo/core";
import { INSTITUTIONS, institutionById, matchInstitutionByLabel } from "@feudo/core/reference-data";

import { interpolate, interpolateAll } from "@/lib/interpolate";
import type { ReservePositionRow } from "./repository";
import { t } from "./strings";
import { UNLISTED_INSTITUTION } from "./validation";

export const TOP_PLACEMENTS = 3;

export type MarkLiquidityChoice = "daily" | "not_daily" | "unknown";

export type ReserveMarkEdit = {
  isReserve: boolean;
  liquidity: MarkLiquidityChoice;
  institutionChoice: string;
  asksLiquidity: boolean;
  asksInstitution: boolean;
  automaticInstitutionName: string | null;
};

export type ReservePositionView = {
  accountId: string;
  name: string;
  institutionLabel: string;
  balanceLabel: string;
  liquidityLabel: string;
  liquidityUnknown: boolean;
  taxLabel: string;
  realYieldLabel: string;
  isReserve: boolean;
  advice: { label: string; tone: "suggest" | "warning" } | null;
  edit: ReserveMarkEdit;
};

export type PlacementRowView = {
  accountId: string;
  placeLabel: string;
  name: string;
  institutionLabel: string;
  realYieldLabel: string;
  netYieldLabel: string;
  taxLabel: string;
  guaranteeLabel: string;
};

export type ExcludedPlacementView = {
  accountId: string;
  name: string;
  institutionLabel: string;
  reasonsLabel: string;
};

export type PlacementRankingView = {
  top: PlacementRowView[];
  alsoRanked: PlacementRowView[];
  excluded: ExcludedPlacementView[];
  indicatorsLabel: string;
};

export type ReserveCoverageView = {
  summaryLabel: string;
  percentLabel: string | null;
  monthsLabel: string | null;
  progressPercent: number;
};

export type InstitutionOption = { value: string; label: string };

export const INSTITUTION_OPTIONS: InstitutionOption[] = [
  ...INSTITUTIONS.map((institution) => ({ value: institution.id, label: institution.name })),
  { value: UNLISTED_INSTITUTION, label: t.markDialog.institutionUnlisted },
];

function money(centavos: number, currency: string = HOUSEHOLD_CURRENCY): string {
  return formatMoney({ amountCentavos: centavos, currency });
}

export function formatRate(ratePpm: RatePpm): string {
  return formatBasisPointsPercent(Math.round(ratePpm / 100));
}

function formatTenths(tenths: number): string {
  const sign = tenths < 0 ? "-" : "";
  const magnitude = Math.abs(tenths);
  const decimal = magnitude % 10;
  const whole = String(Math.trunc(magnitude / 10));
  return `${sign}${whole}${decimal === 0 ? "" : `,${String(decimal)}`}`;
}

function perYear(ratePpm: RatePpm): string {
  return interpolate(t.yield.perYear, "{rate}", formatRate(ratePpm));
}

function taxLabel(tax: PositionTax): string {
  switch (tax.kind) {
    case "bracket":
      return interpolate(t.tax.bracket, "{rate}", formatBasisPointsPercent(tax.basisPoints));
    case "acquisition_date_unknown":
      return interpolate(
        t.tax.acquisitionDateUnknown,
        "{rate}",
        formatBasisPointsPercent(tax.basisPoints),
      );
    case "exempt":
      return t.tax.exempt;
    case "none":
    case "unknown":
      return t.tax.none;
  }
}

function liquidityLabel(liquidity: PositionLiquidity): string {
  return t.liquidity[liquidity];
}

function guaranteeLabel(guarantee: PositionGuarantee): string {
  switch (guarantee.kind) {
    case "fgc":
      return interpolate(t.ranking.fgc, "{amount}", money(guarantee.headroomCentavos));
    case "fgcoop":
      return interpolate(t.ranking.fgcoop, "{amount}", money(guarantee.headroomCentavos));
    case "sovereign":
      return t.ranking.sovereign;
    case "none":
      return "";
  }
}

function reasonsLabel(reasons: readonly ExclusionReason[]): string {
  return reasons.map((reason) => t.ranking.reasons[reason]).join("; ");
}

// An issuer the household picked wins; "unlisted" means none of the known
// institutions; otherwise the connection's own label decides, if it can.
export function resolveInstitutionId(row: ReservePositionRow): string | null {
  if (row.institutionId === UNLISTED_INSTITUTION) {
    return null;
  }
  return row.institutionId ?? matchInstitutionByLabel(row.connectionLabel);
}

function institutionLabel(row: ReservePositionRow): string {
  const id = resolveInstitutionId(row);
  return (id === null ? undefined : institutionById(id)?.name) ?? row.connectionLabel;
}

function markEdit(row: ReservePositionRow, evaluation: PlacementEvaluation): ReserveMarkEdit {
  const product = RESERVE_PRODUCTS[evaluation.product];
  const automaticId = matchInstitutionByLabel(row.connectionLabel);
  return {
    isReserve: row.isReserve,
    liquidity: row.liquidity ?? "unknown",
    institutionChoice: row.institutionId ?? "auto",
    asksLiquidity: product.liquidity === "household",
    asksInstitution: product.guarantee === "deposit" || product.guarantee === "issued",
    automaticInstitutionName:
      automaticId === null ? null : (institutionById(automaticId)?.name ?? null),
  };
}

function indicatorRate(ratePpm: RatePpm | null): string {
  return ratePpm === null ? t.yield.unknown : formatRate(ratePpm);
}

export function indicatorsLabel(rates: ReserveMarketRates): string {
  if (
    rates.cdiAnnualPpm === null &&
    rates.selicAnnualPpm === null &&
    rates.ipca12MonthPpm === null
  ) {
    return t.ranking.indicatorsMissing;
  }
  return interpolateAll(t.ranking.indicators, {
    cdi: indicatorRate(rates.cdiAnnualPpm),
    selic: indicatorRate(rates.selicAnnualPpm),
    ipca: indicatorRate(rates.ipca12MonthPpm),
  });
}

function placementRow(
  row: ReservePositionRow,
  evaluation: PlacementEvaluation & { place: number },
): PlacementRowView {
  const placementYield = evaluation.yield;
  return {
    accountId: row.accountId,
    placeLabel: interpolate(t.ranking.place, "{place}", String(evaluation.place)),
    name: row.name,
    institutionLabel: institutionLabel(row),
    realYieldLabel: placementYield ? perYear(placementYield.realAnnualPpm) : t.yield.unknown,
    netYieldLabel: placementYield
      ? interpolate(t.ranking.netYield, "{rate}", formatRate(placementYield.netAnnualPpm))
      : t.yield.unknown,
    taxLabel: taxLabel(evaluation.tax),
    guaranteeLabel: guaranteeLabel(evaluation.guarantee),
  };
}

export function buildPlacementViews(
  rows: readonly ReservePositionRow[],
  rates: ReserveMarketRates,
  today: string,
): { positions: ReservePositionView[]; ranking: PlacementRankingView } {
  const rowsById = new Map(rows.map((row) => [row.accountId, row]));
  const { ranked, excluded } = rankReservePlacements(
    rows.map((row) => ({
      id: row.accountId,
      name: row.name,
      accountType: row.type,
      productType: row.productType,
      balanceCentavos: row.balanceCentavos,
      currency: row.currency,
      rateType: row.rateType,
      ratePpm: row.ratePpm,
      acquisitionDate: row.acquisitionDate,
      holderDocumentHash: row.holderDocumentHash,
      institutionId: resolveInstitutionId(row),
      liquidityMark: row.liquidity,
    })),
    rates,
    today,
  );
  const evaluations = new Map<string, PlacementEvaluation>(
    [...ranked, ...excluded].map((evaluation) => [evaluation.position.id, evaluation]),
  );

  const positions = rows.flatMap((row): ReservePositionView[] => {
    const evaluation = evaluations.get(row.accountId);
    if (!evaluation) return [];
    const advice = reservePositionAdvice(evaluation, row.isReserve);
    return [
      {
        accountId: row.accountId,
        name: row.name,
        institutionLabel: institutionLabel(row),
        balanceLabel: money(row.balanceCentavos, row.currency),
        liquidityLabel: liquidityLabel(evaluation.liquidity),
        liquidityUnknown: evaluation.liquidity === "unknown",
        taxLabel: taxLabel(evaluation.tax),
        realYieldLabel: evaluation.yield
          ? perYear(evaluation.yield.realAnnualPpm)
          : t.yield.unknown,
        isReserve: row.isReserve,
        advice:
          advice === null
            ? null
            : {
                label: t.positions.advice[advice],
                tone: advice === "suggest" ? "suggest" : "warning",
              },
        edit: markEdit(row, evaluation),
      },
    ];
  });

  const rankedRows = ranked.flatMap((evaluation) => {
    const row = rowsById.get(evaluation.position.id);
    return row ? [placementRow(row, evaluation)] : [];
  });

  return {
    positions,
    ranking: {
      top: rankedRows.slice(0, TOP_PLACEMENTS),
      alsoRanked: rankedRows.slice(TOP_PLACEMENTS),
      excluded: excluded.flatMap((evaluation) => {
        const row = rowsById.get(evaluation.position.id);
        return row
          ? [
              {
                accountId: row.accountId,
                name: row.name,
                institutionLabel: institutionLabel(row),
                reasonsLabel: reasonsLabel(evaluation.exclusions),
              },
            ]
          : [];
      }),
      indicatorsLabel: indicatorsLabel(rates),
    },
  };
}

export function buildCoverageView(
  coverage: ReserveCoverage,
  targetCentavos: number,
): ReserveCoverageView {
  const percentBasisPoints = coverage.percentBasisPoints;
  return {
    summaryLabel: interpolateAll(t.coverage.summary, {
      current: money(coverage.currentCentavos),
      target: money(targetCentavos),
    }),
    // Floored to the tenth shown, so 46.76% reads "46,7%", never "46,8%".
    percentLabel:
      percentBasisPoints === null
        ? null
        : formatBasisPointsPercent(Math.floor(percentBasisPoints / 10) * 10),
    monthsLabel:
      coverage.monthsTenths === null
        ? null
        : interpolate(t.coverage.months, "{months}", formatTenths(coverage.monthsTenths)),
    progressPercent:
      percentBasisPoints === null ? 0 : Math.min(100, Math.max(0, percentBasisPoints / 100)),
  };
}
