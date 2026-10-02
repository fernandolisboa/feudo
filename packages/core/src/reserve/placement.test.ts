import { describe, expect, it } from "vitest";

import {
  rankReservePlacements,
  reservePositionAdvice,
  type PlacementEvaluation,
  type ReservePositionInput,
} from "./placement";
import type { ReserveMarketRates } from "./yield";

const TODAY = "2026-10-02";
const HOLDER = "holder-hash-a";
const OTHER_HOLDER = "holder-hash-b";

const RATES: ReserveMarketRates = {
  cdiAnnualPpm: 149_000,
  selicAnnualPpm: 150_000,
  selicTargetPpm: 150_000,
  ipca12MonthPpm: 52_000,
};

function position(overrides: Partial<ReservePositionInput> & { id: string }): ReservePositionInput {
  return {
    name: overrides.id,
    accountType: "investment",
    productType: null,
    balanceCentavos: 100_000,
    currency: "BRL",
    rateType: null,
    ratePpm: null,
    acquisitionDate: null,
    holderDocumentHash: HOLDER,
    institutionId: null,
    liquidityMark: null,
    ...overrides,
  };
}

// Shaped like the fake provider's fixtures (sync's fake-fixtures.ts), which
// mirror what Pluggy sends for a bank item and a brokerage item.
const CDB = position({
  id: "cdb",
  name: "CDB Fixture 110% CDI",
  productType: "CDB",
  balanceCentavos: 1_025_075,
  rateType: "percentage_of_cdi",
  ratePpm: 1_100_000,
  acquisitionDate: "2025-02-01",
  institutionId: "inter",
  liquidityMark: "daily",
});
const LCI = position({
  id: "lci",
  name: "LCI Fixture 92% CDI",
  productType: "LCI",
  balanceCentavos: 400_000,
  rateType: "percentage_of_cdi",
  ratePpm: 920_000,
  institutionId: "inter",
});
const TESOURO_SELIC = position({
  id: "tesouro",
  name: "Tesouro Selic 2029",
  productType: "TREASURY",
  balanceCentavos: 1_500_040,
  rateType: "other",
  ratePpm: 1_000_000,
  acquisitionDate: "2024-08-12",
});
const SAVINGS = position({
  id: "poupanca",
  name: "Poupança",
  accountType: "savings",
  balanceCentavos: 50_000,
  institutionId: "caixa",
});
const CHECKING_BANK = position({
  id: "checking-inter",
  name: "Conta Inter",
  accountType: "checking",
  balanceCentavos: 200_000,
  institutionId: "inter",
});
const CHECKING_PAYMENT_INSTITUTION = position({
  id: "checking-nubank",
  name: "Conta Nubank",
  accountType: "checking",
  balanceCentavos: 300_000,
  institutionId: "nubank",
});
const FUND = position({
  id: "fund",
  name: "Fundo Multimercado",
  productType: "MULTIMARKET_FUND",
  liquidityMark: "daily",
});
const CDB_UNKNOWN_ISSUER = position({
  id: "cdb-xp",
  name: "CDB Banco Desconhecido",
  productType: "CDB",
  rateType: "fixed_annual",
  ratePpm: 130_000,
  liquidityMark: "daily",
});
const USD_ACCOUNT = position({
  id: "usd",
  name: "Conta Global",
  accountType: "checking",
  currency: "USD",
  institutionId: "inter",
});

function byId(evaluations: readonly PlacementEvaluation[], id: string): PlacementEvaluation {
  const found = evaluations.find((evaluation) => evaluation.position.id === id);
  if (!found) throw new Error(`no evaluation for ${id}`);
  return found;
}

describe("rankReservePlacements", () => {
  const all = [
    CHECKING_PAYMENT_INSTITUTION,
    CHECKING_BANK,
    SAVINGS,
    CDB,
    LCI,
    TESOURO_SELIC,
    FUND,
    CDB_UNKNOWN_ISSUER,
    USD_ACCOUNT,
  ];
  const { ranked, excluded } = rankReservePlacements(all, RATES, TODAY);

  it("ranks the liquid, covered positions by net real yield", () => {
    expect(ranked.map((entry) => [entry.position.id, entry.place])).toEqual([
      ["cdb", 1],
      ["tesouro", 2],
      ["poupanca", 3],
      ["checking-inter", 4],
    ]);
    expect(ranked.map((entry) => entry.yield?.realAnnualPpm)).toEqual([
      80_018, 71_768, 9_200, -49_430,
    ]);
  });

  it("shows the tax bracket each ranked position was taxed at", () => {
    expect(byId(ranked, "cdb").tax).toEqual({
      kind: "bracket",
      basisPoints: 1750,
      holdingDays: 608,
    });
    expect(byId(ranked, "tesouro").tax).toEqual({
      kind: "bracket",
      basisPoints: 1500,
      holdingDays: 781,
    });
    expect(byId(ranked, "poupanca").tax).toEqual({ kind: "exempt" });
    expect(byId(ranked, "checking-inter").tax).toEqual({ kind: "none" });
  });

  it("states every reason a position is left out", () => {
    expect(
      Object.fromEntries(excluded.map((entry) => [entry.position.id, entry.exclusions])),
    ).toEqual({
      "checking-nubank": ["payment_institution_balance"],
      lci: ["liquidity_unknown"],
      fund: ["not_covered", "rate_unknown"],
      "cdb-xp": ["institution_unknown"],
      usd: ["foreign_currency"],
    });
  });

  it("keeps every position exactly once", () => {
    expect(ranked.length + excluded.length).toBe(all.length);
  });

  it("computes FGC headroom per holder and conglomerate", () => {
    const cdb = byId(ranked, "cdb");
    // Inter's conglomerate holds the CDB, the LCI and the checking balance.
    expect(cdb.guarantee).toEqual({
      kind: "fgc",
      institutionId: "inter",
      headroomCentavos: 25_000_000 - 1_025_075 - 400_000 - 200_000,
    });
    expect(byId(ranked, "tesouro").guarantee).toEqual({ kind: "sovereign" });
  });

  it("covers what a payment institution's conglomerate issues, not its balance", () => {
    const rdb = position({
      id: "rdb",
      productType: "RDB",
      rateType: "percentage_of_cdi",
      ratePpm: 1_000_000,
      institutionId: "nubank",
      liquidityMark: "daily",
    });
    const result = rankReservePlacements([rdb, CHECKING_PAYMENT_INSTITUTION], RATES, TODAY);
    expect(result.ranked.map((entry) => entry.position.id)).toEqual(["rdb"]);
    expect(result.excluded[0]?.exclusions).toEqual(["payment_institution_balance"]);
  });

  it("excludes a holder whose conglomerate is at the FGC limit, but not another holder", () => {
    const big = position({
      id: "big",
      productType: "CDB",
      balanceCentavos: 25_000_000,
      rateType: "fixed_annual",
      ratePpm: 140_000,
      institutionId: "itau",
      liquidityMark: "daily",
    });
    const sameHolder = { ...big, id: "same", balanceCentavos: 0 };
    const otherHolder = {
      ...big,
      id: "other",
      balanceCentavos: 0,
      holderDocumentHash: OTHER_HOLDER,
    };
    const result = rankReservePlacements([big, sameHolder, otherHolder], RATES, TODAY);
    expect(result.excluded.map((entry) => [entry.position.id, entry.exclusions])).toEqual([
      ["big", ["fgc_limit_reached"]],
      ["same", ["fgc_limit_reached"]],
    ]);
    expect(result.ranked.map((entry) => entry.position.id)).toEqual(["other"]);
  });

  it("does not pool positions without a holder document", () => {
    const anonymous = position({
      id: "anon-1",
      productType: "CDB",
      balanceCentavos: 20_000_000,
      rateType: "fixed_annual",
      ratePpm: 140_000,
      institutionId: "itau",
      liquidityMark: "daily",
      holderDocumentHash: null,
    });
    const result = rankReservePlacements([anonymous, { ...anonymous, id: "anon-2" }], RATES, TODAY);
    expect(result.ranked.map((entry) => entry.guarantee)).toEqual([
      { kind: "fgc", institutionId: "itau", headroomCentavos: 5_000_000 },
      { kind: "fgc", institutionId: "itau", headroomCentavos: 5_000_000 },
    ]);
  });

  it("shares one FGCoop limit across the cooperative system's positions", () => {
    const rdc = position({
      id: "sicoob-1",
      productType: "CDB",
      balanceCentavos: 10_000_000,
      rateType: "fixed_annual",
      ratePpm: 140_000,
      institutionId: "sicoob",
      liquidityMark: "daily",
    });
    const result = rankReservePlacements([rdc, { ...rdc, id: "sicoob-2" }], RATES, TODAY);
    expect(result.ranked[0]?.guarantee).toEqual({
      kind: "fgcoop",
      institutionId: "sicoob",
      headroomCentavos: 5_000_000,
    });
  });

  it("breaks yield ties by headroom, Tesouro Selic first, then by name", () => {
    const fixed = (id: string, institutionId: string, balanceCentavos: number) =>
      position({
        id,
        name: id,
        productType: "CDB",
        balanceCentavos,
        rateType: "fixed_annual",
        ratePpm: 150_000,
        acquisitionDate: "2020-01-01",
        institutionId,
        liquidityMark: "daily",
      });
    const tesouro = { ...TESOURO_SELIC, id: "t", acquisitionDate: "2020-01-01" };
    const result = rankReservePlacements(
      [
        fixed("b-itau", "itau", 1_000_000),
        fixed("a-bradesco", "bradesco", 1_000_000),
        fixed("c-santander", "santander", 0),
        tesouro,
      ],
      RATES,
      TODAY,
    );
    expect(result.ranked.map((entry) => entry.position.id)).toEqual([
      "t",
      "c-santander",
      "a-bradesco",
      "b-itau",
    ]);
  });

  it("excludes what it cannot compute without market data", () => {
    const result = rankReservePlacements(
      [CDB, SAVINGS, CHECKING_BANK],
      {
        cdiAnnualPpm: null,
        selicAnnualPpm: null,
        selicTargetPpm: null,
        ipca12MonthPpm: null,
      },
      TODAY,
    );
    expect(result.ranked).toEqual([]);
    expect(
      result.excluded.every((entry) => entry.exclusions.includes("market_data_unavailable")),
    ).toBe(true);
  });

  it("lets the household's mark settle liquidity only where the product cannot", () => {
    const notLiquid = rankReservePlacements(
      [
        { ...LCI, liquidityMark: "not_daily" },
        { ...TESOURO_SELIC, liquidityMark: "not_daily" },
      ],
      RATES,
      TODAY,
    );
    expect(notLiquid.excluded.map((entry) => [entry.position.id, entry.exclusions])).toEqual([
      ["lci", ["not_liquid"]],
    ]);
    expect(notLiquid.ranked.map((entry) => entry.position.id)).toEqual(["tesouro"]);
  });

  it("labels an unknown product rather than calling it uncovered", () => {
    const result = rankReservePlacements(
      [position({ id: "mystery", productType: "SOMETHING_NEW", liquidityMark: "daily" })],
      RATES,
      TODAY,
    );
    expect(result.excluded[0]?.exclusions).toEqual(["product_unknown", "rate_unknown"]);
  });
});

describe("reservePositionAdvice", () => {
  const { ranked, excluded } = rankReservePlacements(
    [CDB, LCI, { ...LCI, id: "lci-locked", liquidityMark: "not_daily" }, FUND],
    RATES,
    TODAY,
  );

  it("suggests a liquid, covered position outside the reserve", () => {
    expect(reservePositionAdvice(byId(ranked, "cdb"), false)).toBe("suggest");
    expect(reservePositionAdvice(byId(ranked, "cdb"), true)).toBeNull();
  });

  it("warns about reserve positions that are not liquid or not confirmed", () => {
    expect(reservePositionAdvice(byId(excluded, "lci"), true)).toBe("liquidity_unknown");
    expect(reservePositionAdvice(byId(excluded, "lci-locked"), true)).toBe("not_liquid");
  });

  it("says nothing about excluded positions outside the reserve", () => {
    expect(reservePositionAdvice(byId(excluded, "fund"), false)).toBeNull();
    expect(reservePositionAdvice(byId(excluded, "fund"), true)).toBeNull();
  });
});
