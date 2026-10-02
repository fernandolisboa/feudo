import { FGC_LIMIT_PER_CONGLOMERATE, FGCOOP_LIMIT_PER_INSTITUTION } from "../institutions/fgc";
import type { Institution } from "../institutions/institution";
import { institutionById } from "../institutions/institutions";
import type { RatePpm } from "../market-data/rates";
import { HOUSEHOLD_CURRENCY } from "../money/money";
import {
  classifyReserveProduct,
  RESERVE_PRODUCTS,
  type LiquidityMark,
  type RateType,
  type ReserveAccountType,
  type ReserveProduct,
  type ReserveProductId,
} from "./products";
import { positionTax, taxBasisPoints, type PositionTax } from "./tax";
import {
  grossAnnualYield,
  netAnnualYield,
  realAnnualYield,
  type ReserveMarketRates,
} from "./yield";

export type ReservePositionInput = {
  id: string;
  name: string;
  accountType: ReserveAccountType;
  productType: string | null;
  balanceCentavos: number;
  currency: string;
  rateType: RateType | null;
  ratePpm: RatePpm | null;
  acquisitionDate: string | null;
  holderDocumentHash: string | null;
  institutionId: string | null;
  liquidityMark: LiquidityMark | null;
};

export type PositionLiquidity = LiquidityMark | "unknown";

export type PositionGuarantee =
  | { kind: "fgc" | "fgcoop"; institutionId: string; headroomCentavos: number }
  | { kind: "sovereign" }
  | { kind: "none" };

export const EXCLUSION_REASONS = [
  "foreign_currency",
  "not_liquid",
  "liquidity_unknown",
  "product_unknown",
  "not_covered",
  "payment_institution_balance",
  "institution_unknown",
  "fgc_limit_reached",
  "rate_unknown",
  "market_data_unavailable",
] as const;
export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];

export type PlacementYield = {
  grossAnnualPpm: RatePpm;
  netAnnualPpm: RatePpm;
  realAnnualPpm: RatePpm;
};

export type PlacementEvaluation = {
  position: ReservePositionInput;
  product: ReserveProductId;
  liquidity: PositionLiquidity;
  guarantee: PositionGuarantee;
  tax: PositionTax;
  yield: PlacementYield | null;
  exclusions: ExclusionReason[];
};

export type RankedPlacement = PlacementEvaluation & { place: number };

export type ReservePlacementRanking = {
  ranked: RankedPlacement[];
  excluded: PlacementEvaluation[];
};

type GuaranteeBucket = { kind: "fgc" | "fgcoop"; key: string; limitCentavos: number };

type GuaranteeResolution =
  | { status: "fund"; institution: Institution; bucket: GuaranteeBucket }
  | { status: "sovereign" }
  | { status: "excluded"; reason: ExclusionReason };

function liquidityOf(product: ReserveProduct, mark: LiquidityMark | null): PositionLiquidity {
  return product.liquidity === "daily" ? "daily" : (mark ?? "unknown");
}

function fundBucket(institution: Institution): GuaranteeBucket {
  const guarantee = institution.depositGuarantee;
  switch (guarantee.fund) {
    case "FGC":
      return {
        kind: "fgc",
        key: `fgc:${guarantee.conglomerate.code}`,
        limitCentavos: FGC_LIMIT_PER_CONGLOMERATE.amountCentavos,
      };
    case "FGCoop":
      // The limit is per associated cooperative, which the provider does not
      // name: every position at the cooperative system shares one limit,
      // which can only understate the headroom, never overstate it.
      return {
        kind: "fgcoop",
        key: `fgcoop:${institution.id}`,
        limitCentavos: FGCOOP_LIMIT_PER_INSTITUTION.amountCentavos,
      };
  }
}

function resolveGuarantee(
  product: ReserveProduct,
  institutionId: string | null,
): GuaranteeResolution {
  switch (product.guarantee) {
    case "sovereign":
      return { status: "sovereign" };
    case "none":
      return { status: "excluded", reason: "not_covered" };
    case "unknown":
      return { status: "excluded", reason: "product_unknown" };
    case "deposit":
    case "issued": {
      const institution = institutionId === null ? undefined : institutionById(institutionId);
      if (!institution) {
        return { status: "excluded", reason: "institution_unknown" };
      }
      // A payment institution is not an FGC member: the balance it holds is
      // not a deposit, while what its conglomerate's bank issues is covered.
      if (
        product.guarantee === "deposit" &&
        institution.accountHolder.kind === "payment-institution"
      ) {
        return { status: "excluded", reason: "payment_institution_balance" };
      }
      return { status: "fund", institution, bucket: fundBucket(institution) };
    }
  }
}

// One CPF's credits against one conglomerate (or cooperative) share one limit
// (ADR-0009). A position without a holder document cannot be grouped with
// anyone else's, so it is a group of its own.
function holderKey(position: ReservePositionInput, bucket: GuaranteeBucket): string {
  const holder = position.holderDocumentHash ?? `position:${position.id}`;
  return `${holder}|${bucket.key}`;
}

type ResolvedPosition = {
  position: ReservePositionInput;
  productId: ReserveProductId;
  resolution: GuaranteeResolution;
};

function headroomByHolder(resolved: readonly ResolvedPosition[]): Map<string, number> {
  const used = new Map<string, { usedCentavos: number; limitCentavos: number }>();
  for (const { position, resolution } of resolved) {
    if (resolution.status !== "fund" || position.currency !== HOUSEHOLD_CURRENCY) {
      continue;
    }
    const key = holderKey(position, resolution.bucket);
    const entry = used.get(key) ?? {
      usedCentavos: 0,
      limitCentavos: resolution.bucket.limitCentavos,
    };
    entry.usedCentavos += Math.max(0, position.balanceCentavos);
    used.set(key, entry);
  }
  return new Map(
    [...used].map(([key, entry]) => [key, Math.max(0, entry.limitCentavos - entry.usedCentavos)]),
  );
}

function evaluate(
  { position, productId, resolution }: ResolvedPosition,
  headroom: ReadonlyMap<string, number>,
  rates: ReserveMarketRates,
  today: string,
): PlacementEvaluation {
  const product: ReserveProduct = RESERVE_PRODUCTS[productId];
  const liquidity = liquidityOf(product, position.liquidityMark);
  const tax = positionTax(product.tax, position.acquisitionDate, today);
  const exclusions: ExclusionReason[] = [];

  if (position.currency !== HOUSEHOLD_CURRENCY) {
    exclusions.push("foreign_currency");
  }
  if (liquidity === "not_daily") {
    exclusions.push("not_liquid");
  } else if (liquidity === "unknown") {
    exclusions.push("liquidity_unknown");
  }

  let guarantee: PositionGuarantee = { kind: "none" };
  switch (resolution.status) {
    case "excluded":
      exclusions.push(resolution.reason);
      break;
    case "sovereign":
      guarantee = { kind: "sovereign" };
      break;
    case "fund": {
      const headroomCentavos = headroom.get(holderKey(position, resolution.bucket)) ?? 0;
      guarantee = {
        kind: resolution.bucket.kind,
        institutionId: resolution.institution.id,
        headroomCentavos,
      };
      if (headroomCentavos <= 0) {
        exclusions.push("fgc_limit_reached");
      }
      break;
    }
  }

  const gross = grossAnnualYield(product.yield, position, rates);
  let placementYield: PlacementYield | null = null;
  if (gross.status !== "ok") {
    exclusions.push(gross.status);
  } else if (rates.ipca12MonthPpm === null) {
    exclusions.push("market_data_unavailable");
  } else {
    const netAnnualPpm = netAnnualYield(gross.annualPpm, taxBasisPoints(tax));
    placementYield = {
      grossAnnualPpm: gross.annualPpm,
      netAnnualPpm,
      realAnnualPpm: realAnnualYield(netAnnualPpm, rates.ipca12MonthPpm),
    };
  }

  return {
    position,
    product: productId,
    liquidity,
    guarantee,
    tax,
    yield: placementYield,
    exclusions: [...new Set(exclusions)],
  };
}

function tieBreakHeadroom(guarantee: PositionGuarantee): number {
  switch (guarantee.kind) {
    case "sovereign":
      return Number.POSITIVE_INFINITY;
    case "fgc":
    case "fgcoop":
      return guarantee.headroomCentavos;
    case "none":
      return Number.NEGATIVE_INFINITY;
  }
}

function compareRanked(a: PlacementEvaluation, b: PlacementEvaluation): number {
  const yieldDelta = (b.yield?.realAnnualPpm ?? 0) - (a.yield?.realAnnualPpm ?? 0);
  if (yieldDelta !== 0) {
    return yieldDelta;
  }
  const headroomA = tieBreakHeadroom(a.guarantee);
  const headroomB = tieBreakHeadroom(b.guarantee);
  if (headroomA !== headroomB) {
    return headroomB > headroomA ? 1 : -1;
  }
  return (
    a.position.name.localeCompare(b.position.name, "pt-BR") ||
    (a.position.id < b.position.id ? -1 : a.position.id > b.position.id ? 1 : 0)
  );
}

// ADR-0009: a hard filter (redeemable within one business day, and covered by
// the FGC or FGCoop with headroom left for the holder, or Tesouro Selic),
// then net real yield, ties broken by FGC headroom. Every position comes out
// exactly once, ranked with its place or excluded with every reason that
// applies, in input order.
export function rankReservePlacements(
  positions: readonly ReservePositionInput[],
  rates: ReserveMarketRates,
  today: string,
): ReservePlacementRanking {
  const resolved = positions.map((position) => {
    const productId = classifyReserveProduct(position);
    return {
      position,
      productId,
      resolution: resolveGuarantee(RESERVE_PRODUCTS[productId], position.institutionId),
    };
  });
  const headroom = headroomByHolder(resolved);
  const evaluations = resolved.map((entry) => evaluate(entry, headroom, rates, today));

  const ranked = evaluations
    .filter((evaluation) => evaluation.exclusions.length === 0)
    .sort(compareRanked)
    .map((evaluation, index) => ({ ...evaluation, place: index + 1 }));
  const excluded = evaluations.filter((evaluation) => evaluation.exclusions.length > 0);

  return { ranked, excluded };
}

export type ReservePositionAdvice = "suggest" | "not_liquid" | "liquidity_unknown" | null;

// What the positions table says next to each position: a liquid, covered
// position outside the reserve is suggested; a reserve position that is not
// liquid, or whose liquidity nobody confirmed yet, is warned about.
export function reservePositionAdvice(
  evaluation: PlacementEvaluation,
  isReserve: boolean,
): ReservePositionAdvice {
  if (isReserve) {
    if (evaluation.liquidity === "not_daily") return "not_liquid";
    if (evaluation.liquidity === "unknown") return "liquidity_unknown";
    return null;
  }
  return evaluation.exclusions.length === 0 ? "suggest" : null;
}
