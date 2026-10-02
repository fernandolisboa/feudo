import type { AnalysisFact } from "@feudo/core";

import type { HouseholdScope } from "@/modules/households";
import type { StatTileView } from "@/ui/stat-tile";

import { interpolate, interpolateAll } from "@/lib/interpolate";
import { buildReservePageProps, type ReservePageProps } from "./page-props";
import type { PlacementRowView } from "./placement-views";
import { t } from "./strings";

const MAX_RANKED_FACTS = 6;

function tileValue(tile: StatTileView): string {
  if (tile.value === "—") {
    return tile.meta ?? tile.value;
  }
  return tile.meta === null
    ? tile.value
    : interpolateAll(t.analysisFacts.tileValue, { value: tile.value, meta: tile.meta });
}

function rankedFact(row: PlacementRowView, index: number): AnalysisFact {
  return {
    key: `reserve.ranking.${String(index + 1)}`,
    label: interpolate(t.analysisFacts.ranked, "{place}", row.placeLabel),
    value: interpolateAll(t.analysisFacts.rankedValue, {
      product: t.products[row.product],
      institution: row.institutionName ?? t.analysisFacts.institutionUnknown,
      realYield: row.realYieldLabel,
      netYield: row.netYieldLabel,
      tax: row.taxLabel,
      guarantee: row.guaranteeLabel === "" ? "—" : row.guaranteeLabel,
    }),
  };
}

// Built from the same view the Reserva page renders. Account names stay out:
// they are the bank's own free text (ADR-0004), so a position is named by its
// product and the institution resolved from reference data instead.
export function reserveAnalysisFacts(props: ReservePageProps): AnalysisFact[] {
  if (!props.hasAccounts) {
    return [];
  }
  const strings = t.analysisFacts;
  const facts: AnalysisFact[] = [
    {
      key: "reserve.multiple",
      label: strings.multiple,
      value: interpolate(strings.multipleValue, "{multiple}", String(props.multiple)),
    },
  ];

  if (props.tiles === null) {
    facts.push({ key: "reserve.target", label: strings.noHistory, value: strings.noHistoryValue });
  } else {
    facts.push(
      { key: "reserve.target", label: strings.target, value: tileValue(props.tiles.target) },
      {
        key: "reserve.average_fixed_cost",
        label: strings.averageFixedCost,
        value: tileValue(props.tiles.averageFixedCost),
      },
      {
        key: "reserve.current",
        label: strings.currentReserve,
        value: tileValue(props.tiles.currentReserve),
      },
      { key: "reserve.coverage", label: strings.coverage, value: tileValue(props.tiles.coverage) },
    );
  }

  const suggested = props.positions.filter((position) => position.advice?.tone === "suggest");
  const attention = props.positions.filter((position) => position.advice?.tone === "warning");
  if (suggested.length > 0) {
    facts.push({
      key: "reserve.suggested_positions",
      label: strings.suggested,
      value: String(suggested.length),
    });
  }
  if (attention.length > 0) {
    facts.push({
      key: "reserve.positions_needing_attention",
      label: strings.attention,
      value: String(attention.length),
    });
  }

  if (props.ranking !== null) {
    const ranked = [...props.ranking.top, ...props.ranking.alsoRanked].slice(0, MAX_RANKED_FACTS);
    if (ranked.length === 0) {
      facts.push({
        key: "reserve.ranking",
        label: strings.rankingEmpty,
        value: strings.rankingEmptyValue,
      });
    }
    facts.push(...ranked.map(rankedFact));
    if (props.ranking.excluded.length > 0) {
      facts.push({
        key: "reserve.excluded",
        label: strings.excluded,
        value: String(props.ranking.excluded.length),
      });
    }
    facts.push({
      key: "reserve.indicators",
      label: strings.indicators,
      value: props.ranking.indicatorsLabel,
    });
  }
  return facts;
}

export async function getReserveAnalysisFacts(
  scope: HouseholdScope,
  now: Date,
): Promise<AnalysisFact[]> {
  return reserveAnalysisFacts(await buildReservePageProps(scope, { now, canManage: false }));
}
