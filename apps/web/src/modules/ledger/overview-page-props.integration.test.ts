import { describe, expect, it } from "vitest";
import { formatMoney } from "@feudo/core";

import { householdScope } from "@/modules/households";
import {
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { getOverviewPageProps } from "./overview-page-props";

// 01:30 UTC on 1 October is still 30 September in America/Sao_Paulo, the
// default time zone of a household with no settings row.
const NOW = new Date("2026-10-01T01:30:00.000Z");

function findSeries(series: { month: string }[], month: string) {
  const point = series.find((entry) => entry.month === month);
  if (!point) {
    throw new Error(`series is missing ${month}`);
  }
  return point;
}

describe("getOverviewPageProps (integration)", () => {
  it("computes the month's totals, savings rate, categories and a full average fixed cost from three months of history", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "salary",
            date: "2026-09-05",
            description: "SALARIO SETEMBRO",
            providerCategory: "Salary",
            type: "credit",
            amountCentavos: 500000,
          }),
          seedTransaction({
            providerTransactionId: "fixed-current",
            date: "2026-09-06",
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -80000,
          }),
          seedTransaction({
            providerTransactionId: "variable-current",
            date: "2026-09-07",
            description: "COMPRA MERCADO",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -20000,
          }),
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

      const props = await getOverviewPageProps(userA.session, { mes: "2026-09" }, NOW);

      expect(props.month).toBe("2026-09");
      expect(props.incomeCentavos).toBe(500000);
      expect(props.spendingCentavos).toBe(100000);
      expect(props.savingsRateBasisPoints).toBe(8000);
      expect(props.tiles.income.value).toBe(
        formatMoney({ amountCentavos: 500000, currency: "BRL" }),
      );
      expect(props.tiles.spending.value).toBe(
        formatMoney({ amountCentavos: 100000, currency: "BRL" }),
      );
      expect(props.tiles.savingsRate.value).toBe("80%");

      expect(props.categorySpending).toEqual([
        {
          key: "housing",
          label: "Moradia",
          amountLabel: formatMoney({ amountCentavos: 80000, currency: "BRL" }),
          fraction: 1,
        },
        {
          key: "food",
          label: "Alimentação",
          amountLabel: formatMoney({ amountCentavos: 20000, currency: "BRL" }),
          fraction: 0.25,
        },
      ]);

      expect(props.tiles.averageFixedCost).toEqual({
        label: "Custo fixo médio",
        value: formatMoney({ amountCentavos: 80000, currency: "BRL" }),
        meta: "média de 3 meses",
      });

      expect(props.series).toHaveLength(6);
      expect(findSeries(props.series, "2026-04")).toMatchObject({
        incomeCentavos: 0,
        spendingCentavos: 0,
      });
      expect(findSeries(props.series, "2026-06")).toMatchObject({
        incomeCentavos: 0,
        spendingCentavos: 90000,
      });
      expect(findSeries(props.series, "2026-07")).toMatchObject({
        incomeCentavos: 0,
        spendingCentavos: 60000,
      });
      expect(findSeries(props.series, "2026-08")).toMatchObject({
        incomeCentavos: 0,
        spendingCentavos: 90000,
      });
      expect(findSeries(props.series, "2026-09")).toMatchObject({
        incomeCentavos: 500000,
        spendingCentavos: 100000,
      });
    });
  });

  it("estimates the average fixed cost and names the months behind it when fewer than three have history", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "fixed-only-month",
            date: "2026-08-10",
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -45000,
          }),
        ],
      });

      const props = await getOverviewPageProps(userA.session, { mes: "2026-09" }, NOW);

      expect(props.tiles.averageFixedCost).toEqual({
        label: "Custo fixo médio",
        value: formatMoney({ amountCentavos: 45000, currency: "BRL" }),
        meta: "estimativa com base em: agosto de 2026",
      });
    });
  });

  it("shows a plain dash with an explanation when there is no fixed-cost history at all", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, { household: householdScope(userA.session) });

      const props = await getOverviewPageProps(userA.session, { mes: "2026-09" }, NOW);

      expect(props.tiles.averageFixedCost).toEqual({
        label: "Custo fixo médio",
        value: "—",
        meta: "Ainda sem histórico de custo fixo.",
      });
      expect(props.tiles.savingsRate).toEqual({
        label: "Taxa de poupança",
        value: "—",
        meta: "Sem renda registrada neste mês.",
      });
    });
  });

  it("leaves a detected internal transfer and an uncategorized row out of every total, and counts the uncategorized row for the month alone", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [seedAccount(), seedAccount({ providerAccountId: "acc-2", name: "Poupança" })],
        transactions: [
          seedTransaction({
            providerTransactionId: "salary",
            providerAccountId: "acc-1",
            date: "2026-09-05",
            description: "SALARIO SETEMBRO",
            providerCategory: "Salary",
            type: "credit",
            amountCentavos: 500000,
          }),
          seedTransaction({
            providerTransactionId: "transfer-debit",
            providerAccountId: "acc-1",
            date: "2026-09-10",
            description: "TRANSFERENCIA CASA",
            type: "debit",
            amountCentavos: -50000,
          }),
          seedTransaction({
            providerTransactionId: "transfer-credit",
            providerAccountId: "acc-2",
            date: "2026-09-10",
            description: "TRANSFERENCIA CASA",
            type: "credit",
            amountCentavos: 50000,
          }),
          seedTransaction({
            providerTransactionId: "uncategorized",
            providerAccountId: "acc-1",
            date: "2026-09-12",
            description: "TRANSACAO DESCONHECIDA",
            providerCategory: null,
            type: "debit",
            amountCentavos: -12345,
          }),
        ],
      });

      const props = await getOverviewPageProps(userA.session, { mes: "2026-09" }, NOW);

      expect(props.incomeCentavos).toBe(500000);
      expect(props.spendingCentavos).toBe(0);
      expect(props.categorySpending).toEqual([]);
      expect(props.uncategorized).toEqual({
        count: 1,
        amountLabel: formatMoney({ amountCentavos: 12345, currency: "BRL" }),
      });
    });
  });

  it("excludes a non-BRL account from every total", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [
          seedAccount(),
          seedAccount({ providerAccountId: "acc-usd", name: "Conta global", currency: "USD" }),
        ],
        transactions: [
          seedTransaction({
            providerTransactionId: "usd-salary",
            providerAccountId: "acc-usd",
            date: "2026-09-05",
            description: "SALARY USD",
            providerCategory: "Salary",
            type: "credit",
            amountCentavos: 500000,
            currency: "USD",
          }),
          seedTransaction({
            providerTransactionId: "brl-groceries",
            providerAccountId: "acc-1",
            date: "2026-09-06",
            description: "COMPRA MERCADO",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -20000,
            currency: "BRL",
          }),
        ],
      });

      const props = await getOverviewPageProps(userA.session, { mes: "2026-09" }, NOW);

      expect(props.incomeCentavos).toBe(0);
      expect(props.spendingCentavos).toBe(20000);
    });
  });

  it("counts a late-night transaction on the household's local last day of the month, not the stored UTC day", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "late-night-pix",
            date: "2026-09-01",
            occurredAt: new Date("2026-08-31T23:30:00-03:00"),
            description: "PIX ENVIADO CONDOMINIO",
            type: "debit",
            amountCentavos: -5000,
          }),
        ],
      });

      const august = await getOverviewPageProps(userA.session, { mes: "2026-08" }, NOW);
      const september = await getOverviewPageProps(userA.session, { mes: "2026-09" }, NOW);

      expect(august.spendingCentavos).toBe(5000);
      expect(september.spendingCentavos).toBe(0);
    });
  });

  it("defaults to the current month in the household's time zone and never moves past it", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, { household: householdScope(userA.session) });

      const defaulted = await getOverviewPageProps(userA.session, {}, NOW);
      expect(defaulted.month).toBe("2026-09");
      expect(defaulted.nextMonth).toBeNull();
      expect(defaulted.inProgress).toBe(true);

      const clamped = await getOverviewPageProps(userA.session, { mes: "2026-12" }, NOW);
      expect(clamped.month).toBe("2026-09");
    });
  });

  it("never lets household B's rows enter household A's dashboard, or the reverse", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "a-salary",
            date: "2026-09-05",
            description: "SALARIO CASA A",
            providerCategory: "Salary",
            type: "credit",
            amountCentavos: 500000,
          }),
        ],
      });
      await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: "household-b-item",
        transactions: [
          seedTransaction({
            providerTransactionId: "b-salary",
            date: "2026-09-05",
            description: "SALARIO CASA B",
            providerCategory: "Salary",
            type: "credit",
            amountCentavos: 900000,
          }),
        ],
      });

      const propsA = await getOverviewPageProps(userA.session, { mes: "2026-09" }, NOW);
      const propsB = await getOverviewPageProps(userB.session, { mes: "2026-09" }, NOW);

      expect(propsA.incomeCentavos).toBe(500000);
      expect(propsB.incomeCentavos).toBe(900000);
    });
  });
});
