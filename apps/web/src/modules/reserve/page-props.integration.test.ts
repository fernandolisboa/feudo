import { describe, expect, it } from "vitest";
import { formatMoney, formatYearMonth } from "@feudo/core";

import { interpolate } from "@/lib/interpolate";
import { householdScope } from "@/modules/households";
import { marketData } from "@/modules/market-data/schema";
import {
  FAKE_ITEM_BANCO_FIXTURE,
  FAKE_ITEM_CORRETORA_FIXTURE,
  readFakeProviderItem,
} from "@/modules/sync/test/fake-provider-item";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import {
  createReserveMarkRepository,
  createReserveTargetNoticeRepository,
  createReserveTargetRecordRepository,
} from "./repository";
import { getReservePageProps } from "./page-props";
import { t } from "./strings";

// Same instant overview-page-props.integration.test.ts anchors its own
// month on: 01:30 UTC on 1 October 2026 is still 30 September 2026 in
// America/Sao_Paulo, the default time zone with no settings row.
const NOW = new Date("2026-10-01T01:30:00.000Z");

describe("getReservePageProps (integration)", () => {
  it("shows the no-accounts empty state when the household has no bank account", async () => {
    await withTwoUsers(async ({ userA }) => {
      const props = await getReservePageProps(userA.session, NOW);

      expect(props.hasAccounts).toBe(false);
      expect(props.hasHistory).toBe(false);
      expect(props.headline).toBe(t.headline.noAccounts);
      expect(props.tiles).toBeNull();
    });
  });

  it("shows the no-history empty state when the household has accounts but nothing categorized in the window", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      await seedSyncedConnection(db, userA, { household: scope, transactions: [] });

      const props = await getReservePageProps(userA.session, NOW);

      expect(props.hasAccounts).toBe(true);
      expect(props.hasHistory).toBe(false);
      expect(props.headline).toBe(t.headline.noHistory);
      expect(props.tiles).toBeNull();
    });
  });

  it("computes the live target from the same window the month-close job would use, and lists the notice when one is undismissed", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      await seedSyncedConnection(db, userA, {
        household: scope,
        transactions: [
          seedTransaction({
            providerTransactionId: "fixed-june",
            date: "2026-06-10",
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -90000,
          }),
          seedTransaction({
            providerTransactionId: "fixed-july",
            date: "2026-07-10",
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -60000,
          }),
          seedTransaction({
            providerTransactionId: "fixed-august",
            date: "2026-08-10",
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -90000,
          }),
        ],
      });
      await createReserveTargetRecordRepository(scope).insert(db, {
        closedMonth: "2026-07",
        averageFixedCostCentavos: 20000,
        monthsUsed: 1,
        isEstimate: true,
        reserveMultiple: 6,
        targetCentavos: 120000,
        currency: "BRL",
      });
      await createReserveTargetNoticeRepository(scope).insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 120000,
        newTargetCentavos: 480000,
      });

      const props = await getReservePageProps(userA.session, NOW);

      expect(props.hasAccounts).toBe(true);
      expect(props.hasHistory).toBe(true);
      expect(props.multiple).toBe(6);
      expect(props.tiles?.target.value).toBe(
        formatMoney({ amountCentavos: 480000, currency: "BRL" }),
      );
      expect(props.tiles?.averageFixedCost.value).toBe(
        formatMoney({ amountCentavos: 80000, currency: "BRL" }),
      );
      const expectedMonths = `${formatYearMonth("2026-06")}, ${formatYearMonth("2026-07")} e ${formatYearMonth("2026-08")}`;
      expect(props.tiles?.averageFixedCost.meta).toBe(`média de: ${expectedMonths}`);
      expect(props.notice).not.toBeNull();
      expect(props.notice?.message).toContain(
        formatMoney({ amountCentavos: 120000, currency: "BRL" }),
      );
      expect(props.notice?.message).toContain(
        formatMoney({ amountCentavos: 480000, currency: "BRL" }),
      );
    });
  });

  it("does not list a notice once it has been dismissed", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      await createReserveTargetNoticeRepository(scope).insert(db, {
        closedMonth: "2026-08",
        previousTargetCentavos: 120000,
        newTargetCentavos: 480000,
      });
      const notice = await createReserveTargetNoticeRepository(scope).getUndismissed(db);
      if (!notice) throw new Error("test setup: notice was not created");
      await createReserveTargetNoticeRepository(scope).dismiss(db, notice.id);

      const props = await getReservePageProps(userA.session, NOW);

      expect(props.notice).toBeNull();
    });
  });

  it("ranks the fake provider's positions end to end: filter, net real yield, reasons and coverage", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const scope = householdScope(userA.session);
      const bancoAccounts = await readFakeProviderItem(FAKE_ITEM_BANCO_FIXTURE);
      const corretoraAccounts = await readFakeProviderItem(FAKE_ITEM_CORRETORA_FIXTURE);
      const checkingProviderId = "a1000000-0000-4000-8000-000000000001";
      const banco = await seedSyncedConnection(db, userA, {
        household: scope,
        itemId: FAKE_ITEM_BANCO_FIXTURE,
        institutionName: "Banco Inter",
        accounts: bancoAccounts,
        transactions: ["2026-06-10", "2026-07-10", "2026-08-10"].map((date) =>
          seedTransaction({
            providerTransactionId: `fixed-${date}`,
            providerAccountId: checkingProviderId,
            date,
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -80000,
          }),
        ),
      });
      const corretora = await seedSyncedConnection(db, userA, {
        household: scope,
        itemId: FAKE_ITEM_CORRETORA_FIXTURE,
        institutionName: "MeuPluggy",
        accounts: corretoraAccounts,
      });
      // Another household's identical positions never reach this one.
      await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: FAKE_ITEM_BANCO_FIXTURE,
        accounts: bancoAccounts,
      });
      await db.insert(marketData).values([
        { seriesCode: "12", referenceDate: "2026-09-29", value: "0.055131" },
        { seriesCode: "11", referenceDate: "2026-09-29", value: "0.055131" },
        { seriesCode: "432", referenceDate: "2026-09-29", value: "15.00" },
        { seriesCode: "433", referenceDate: "2026-08-01", value: "0.45" },
        { seriesCode: "13522", referenceDate: "2026-08-01", value: "5.20" },
      ]);
      const cdb = banco.accountIdsByProvider.get("b1000000-0000-4000-8000-000000000001") ?? "";
      const tesouro =
        corretora.accountIdsByProvider.get("b2000000-0000-4000-8000-000000000001") ?? "";
      const marks = createReserveMarkRepository(scope);
      await marks.set(
        db,
        { accountId: cdb, isReserve: true, liquidity: "daily", institutionId: null },
        userA.id,
      );
      await marks.set(
        db,
        { accountId: tesouro, isReserve: true, liquidity: null, institutionId: null },
        userA.id,
      );
      const contaGlobal =
        banco.accountIdsByProvider.get("a1000000-0000-4000-8000-000000000004") ?? "";
      await marks.set(
        db,
        { accountId: contaGlobal, isReserve: true, liquidity: null, institutionId: null },
        userA.id,
      );

      const props = await getReservePageProps(userA.session, NOW);

      expect(props.ranking?.top.map((row) => [row.placeLabel, row.name])).toEqual([
        ["1º", "CDB Fixture 110% CDI"],
        ["2º", "Tesouro Selic 2029"],
        ["3º", "Poupança"],
      ]);
      expect(props.ranking?.top[0]).toMatchObject({
        institutionLabel: "Inter",
        taxLabel: "17,5%",
      });
      expect(props.ranking?.top[1]?.guaranteeLabel).toBe(t.ranking.sovereign);
      expect(props.ranking?.alsoRanked.map((row) => [row.placeLabel, row.name])).toEqual([
        ["4º", "Conta corrente"],
      ]);
      expect(props.ranking?.excluded.map((row) => [row.name, row.reasonsLabel]).sort()).toEqual(
        [
          ["Conta global", t.ranking.reasons.foreign_currency],
          ["LCI Fixture 92% CDI", t.ranking.reasons.liquidity_unknown],
        ].sort(),
      );
      expect(props.positions.map((row) => row.name)).not.toContain("Cartão Fixture Platinum");
      expect(props.positions).toHaveLength(6);

      const reserveCentavos = 1_025_075 + 1_500_040;
      expect(props.tiles?.currentReserve).toMatchObject({
        value: formatMoney({ amountCentavos: reserveCentavos, currency: "BRL" }),
        meta: interpolate(t.tiles.currentReserveCount, "{count}", "2"),
      });
      expect(props.coverage?.summaryLabel).toContain(
        formatMoney({ amountCentavos: reserveCentavos, currency: "BRL" }),
      );
      expect(props.tiles?.coverage.meta).toBe(props.coverage?.monthsLabel);
    });
  });

  it("shows positions and the ranking before any month is categorized", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scope = householdScope(userA.session);
      await seedSyncedConnection(db, userA, {
        household: scope,
        itemId: FAKE_ITEM_CORRETORA_FIXTURE,
        accounts: await readFakeProviderItem(FAKE_ITEM_CORRETORA_FIXTURE),
      });

      const props = await getReservePageProps(userA.session, NOW);

      expect(props.hasHistory).toBe(false);
      expect(props.coverage).toBeNull();
      expect(props.positions.map((row) => row.name)).toEqual(["Tesouro Selic 2029"]);
      expect(props.ranking?.top).toEqual([]);
      expect(props.ranking?.excluded[0]?.reasonsLabel).toBe(
        t.ranking.reasons.market_data_unavailable,
      );
      expect(props.ranking?.indicatorsLabel).toBe(t.ranking.indicatorsMissing);
    });
  });
});
