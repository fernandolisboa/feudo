import { describe, expect, it } from "vitest";
import type { ReserveMarketRates } from "@feudo/core";

import {
  buildCoverageView,
  buildPlacementViews,
  indicatorsLabel,
  resolveInstitutionId,
  TOP_PLACEMENTS,
} from "./placement-views";
import type { ReservePositionRow } from "./repository";
import { t } from "./strings";

const TODAY = "2026-10-02";
const RATES: ReserveMarketRates = {
  cdiAnnualPpm: 149_000,
  selicAnnualPpm: 150_000,
  selicTargetPpm: 150_000,
  ipca12MonthPpm: 52_000,
};

function row(overrides: Partial<ReservePositionRow> & { accountId: string }): ReservePositionRow {
  return {
    name: overrides.accountId,
    type: "investment",
    productType: null,
    balanceCentavos: 100_000,
    currency: "BRL",
    rateType: null,
    ratePpm: null,
    acquisitionDate: null,
    holderDocumentHash: "holder",
    connectionLabel: "Banco Inter",
    isReserve: false,
    liquidity: null,
    institutionId: null,
    ...overrides,
  };
}

const CDB = row({
  accountId: "cdb",
  name: "CDB 110% CDI",
  productType: "CDB",
  balanceCentavos: 1_025_075,
  rateType: "percentage_of_cdi",
  ratePpm: 1_100_000,
  acquisitionDate: "2025-02-01",
  liquidity: "daily",
});
const LCI = row({
  accountId: "lci",
  name: "LCI 92% CDI",
  productType: "LCI",
  rateType: "percentage_of_cdi",
  ratePpm: 920_000,
  isReserve: true,
});
const TESOURO = row({
  accountId: "tesouro",
  name: "Tesouro Selic 2029",
  productType: "TREASURY",
  rateType: "other",
  ratePpm: 1_000_000,
  connectionLabel: "MeuPluggy",
});

describe("resolveInstitutionId", () => {
  it("uses the household's pick over the connection label", () => {
    expect(resolveInstitutionId(row({ accountId: "a", institutionId: "btg" }))).toBe("btg");
  });

  it("falls back to the connection label", () => {
    expect(resolveInstitutionId(row({ accountId: "a" }))).toBe("inter");
    expect(resolveInstitutionId(row({ accountId: "a", connectionLabel: "MeuPluggy" }))).toBeNull();
  });

  it("treats an unlisted issuer as unknown, even when the label matches", () => {
    expect(resolveInstitutionId(row({ accountId: "a", institutionId: "unlisted" }))).toBeNull();
  });
});

describe("buildPlacementViews", () => {
  const { positions, ranking } = buildPlacementViews([CDB, LCI, TESOURO], RATES, TODAY);

  it("ranks with places, yields after tax and FGC headroom", () => {
    expect(ranking.top.map((entry) => [entry.placeLabel, entry.name])).toEqual([
      ["1º", "CDB 110% CDI"],
      ["2º", "Tesouro Selic 2029"],
    ]);
    expect(ranking.top[0]).toMatchObject({
      institutionLabel: "Inter",
      realYieldLabel: "8% a.a.",
      netYieldLabel: "13,6% a.a. depois do IR",
      taxLabel: "17,5%",
      guaranteeLabel: "FGC: ainda cabem R$\u00a0238.749,25",
    });
    expect(ranking.top[1]?.guaranteeLabel).toBe(t.ranking.sovereign);
  });

  it("lists what was left out with its reasons", () => {
    expect(ranking.excluded).toEqual([
      {
        accountId: "lci",
        name: "LCI 92% CDI",
        institutionLabel: "Inter",
        reasonsLabel: t.ranking.reasons.liquidity_unknown,
      },
    ]);
  });

  it("moves places past the top into 'also evaluated'", () => {
    const many = Array.from({ length: TOP_PLACEMENTS + 2 }, (_, index) =>
      row({
        accountId: `cdb-${String(index)}`,
        productType: "CDB",
        rateType: "fixed_annual",
        ratePpm: 120_000 + index,
        liquidity: "daily",
      }),
    );
    const views = buildPlacementViews(many, RATES, TODAY);
    expect(views.ranking.top).toHaveLength(TOP_PLACEMENTS);
    expect(views.ranking.alsoRanked.map((entry) => entry.placeLabel)).toEqual(["4º", "5º"]);
  });

  it("describes each position for the table, warning about an unconfirmed reserve position", () => {
    expect(positions.map((position) => position.accountId)).toEqual(["cdb", "lci", "tesouro"]);
    expect(positions[0]).toMatchObject({
      balanceLabel: "R$\u00a010.250,75",
      liquidityLabel: t.liquidity.daily,
      liquidityUnknown: false,
      isReserve: false,
      advice: { label: t.positions.advice.suggest, tone: "suggest" },
    });
    expect(positions[1]).toMatchObject({
      liquidityLabel: t.liquidity.unknown,
      liquidityUnknown: true,
      taxLabel: t.tax.exempt,
      isReserve: true,
      advice: { label: t.positions.advice.liquidity_unknown, tone: "warning" },
    });
  });

  it("asks only what the product type cannot settle", () => {
    expect(positions[0]?.edit).toEqual({
      isReserve: false,
      liquidity: "daily",
      institutionChoice: "auto",
      asksLiquidity: true,
      asksInstitution: true,
      automaticInstitutionName: "Inter",
    });
    expect(positions[2]?.edit).toMatchObject({
      asksLiquidity: false,
      asksInstitution: false,
      automaticInstitutionName: null,
    });
  });

  it("labels the worst bracket when the acquisition date is unknown", () => {
    const views = buildPlacementViews([{ ...CDB, acquisitionDate: null }], RATES, TODAY);
    expect(views.positions[0]?.taxLabel).toBe("22,5%, data de aplicação desconhecida");
  });
});

describe("indicatorsLabel", () => {
  it("names the indicators the yields came from", () => {
    expect(indicatorsLabel(RATES)).toBe(
      "Taxas ao ano: CDI 14,9% · Selic 15% · IPCA em 12 meses 5,2%",
    );
  });

  it("says so when no indicator is available, and marks a single gap", () => {
    expect(
      indicatorsLabel({
        cdiAnnualPpm: null,
        selicAnnualPpm: null,
        selicTargetPpm: null,
        ipca12MonthPpm: null,
      }),
    ).toBe(t.ranking.indicatorsMissing);
    expect(indicatorsLabel({ ...RATES, selicAnnualPpm: null })).toBe(
      "Taxas ao ano: CDI 14,9% · Selic — · IPCA em 12 meses 5,2%",
    );
  });
});

describe("buildCoverageView", () => {
  it("floors the share to the tenth shown", () => {
    expect(
      buildCoverageView(
        { currentCentavos: 2_525_115, percentBasisPoints: 4676, monthsTenths: 28 },
        5_400_000,
      ),
    ).toEqual({
      summaryLabel: "R$\u00a025.251,15 de R$\u00a054.000,00",
      percentLabel: "46,7%",
      monthsLabel: "2,8 meses de custo fixo",
      progressPercent: 46.76,
    });
  });

  it("caps the bar at 100% and drops labels it cannot compute", () => {
    expect(
      buildCoverageView(
        { currentCentavos: 1_000_000, percentBasisPoints: null, monthsTenths: null },
        0,
      ),
    ).toMatchObject({ percentLabel: null, monthsLabel: null, progressPercent: 0 });
    expect(
      buildCoverageView(
        { currentCentavos: 2_000_000, percentBasisPoints: 20_000, monthsTenths: 120 },
        1_000_000,
      ).progressPercent,
    ).toBe(100);
  });
});
