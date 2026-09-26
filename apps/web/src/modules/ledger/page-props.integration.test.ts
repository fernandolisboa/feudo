import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { formatMoney } from "@feudo/core";

import { householdScope } from "@/modules/households";
import { bankTransaction } from "@/modules/sync/schema";
import {
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import { createCategorizationRepository } from "./categorization-repository";
import { getTransactionsPageProps } from "./page-props";
import { t } from "./strings";
import { TRANSACTIONS_PAGE_SIZE } from "./validation";

import type { Database } from "@/platform/db/client";

async function transactionIdFor(db: Database, providerTransactionId: string): Promise<string> {
  const [row] = await db
    .select({ id: bankTransaction.id })
    .from(bankTransaction)
    .where(eq(bankTransaction.providerTransactionId, providerTransactionId));
  if (!row) {
    throw new Error(`seed did not create transaction ${providerTransactionId}`);
  }
  return row.id;
}

// 01:30 UTC on 1 October is still 30 September in America/Sao_Paulo, the
// default time zone of a household with no settings row.
const NOW = new Date("2026-10-01T01:30:00.000Z");

describe("getTransactionsPageProps (integration)", () => {
  it("defaults to the current month in the household's time zone and never moves past it", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [seedTransaction({ date: "2026-09-30" })],
      });

      const props = await getTransactionsPageProps(userA.session, {}, NOW);

      expect(props).toMatchObject({
        month: "2026-09",
        monthLabel: "setembro de 2026",
        previousMonth: "2026-08",
        nextMonth: null,
        selectedAccountId: null,
        total: 1,
        page: 1,
        hasMore: false,
      });
      expect(props.transactions.map((transaction) => transaction.date)).toEqual(["2026-09-30"]);
      expect(props.accounts.map((account) => account.name)).toEqual(["Conta corrente"]);
    });
  });

  it("reads the month, account and page from the URL and drops what it cannot use", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const seeded = await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [seedAccount(), seedAccount({ providerAccountId: "acc-2", name: "Poupança" })],
        transactions: [
          seedTransaction({ providerTransactionId: "t1", date: "2026-08-10" }),
          seedTransaction({
            providerTransactionId: "t2",
            date: "2026-08-11",
            providerAccountId: "acc-2",
          }),
        ],
      });
      const other = await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: "other-item",
      });
      const savings = seeded.accountIdsByProvider.get("acc-2") ?? "";

      const filtered = await getTransactionsPageProps(
        userA.session,
        { mes: "2026-08", conta: savings },
        NOW,
      );
      expect(filtered).toMatchObject({
        month: "2026-08",
        nextMonth: "2026-09",
        selectedAccountId: savings,
        total: 1,
      });
      expect(filtered.transactions.map((transaction) => transaction.accountName)).toEqual([
        "Poupança",
      ]);

      const foreignAccount = other.accountIdsByProvider.get("acc-1") ?? "";
      const unusable = await getTransactionsPageProps(
        userA.session,
        { mes: "2026-8", conta: foreignAccount, pagina: "0" },
        NOW,
      );
      expect(unusable).toMatchObject({
        month: "2026-09",
        selectedAccountId: null,
        page: 1,
        total: 0,
      });

      const pastTheEnd = await getTransactionsPageProps(
        userA.session,
        { mes: "2026-08", pagina: "7" },
        NOW,
      );
      expect(pastTheEnd).toMatchObject({ page: 1, total: 2, hasMore: false });
      expect(pastTheEnd.transactions).toHaveLength(2);
    });
  });

  it("resolves categorization precedence end-to-end: provider mapping, a default rule beating it, a household rule beating the default, and a manual choice beating everything", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "prov-1",
            date: "2026-09-05",
            description: "SALARIO EMPRESA X",
            providerCategory: "Salary",
            type: "credit",
            amountCentavos: 500000,
          }),
          seedTransaction({
            providerTransactionId: "prov-2",
            date: "2026-09-06",
            description: "IOF SOBRE COMPRA INTERNACIONAL",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -5000,
          }),
          seedTransaction({
            providerTransactionId: "prov-3",
            date: "2026-09-07",
            description: "PIX ENVIADO CONDOMINIO RESIDENCIAL",
            providerCategory: null,
            type: "debit",
            amountCentavos: -80000,
          }),
          seedTransaction({
            providerTransactionId: "prov-4",
            date: "2026-09-08",
            description: "PIX ENVIADO CONDOMINIO GARAGEM",
            providerCategory: null,
            type: "debit",
            amountCentavos: -1000,
          }),
        ],
      });

      const categorization = createCategorizationRepository(householdScope(userA.session));
      await categorization.saveRule(
        db,
        {
          pattern: "PIX ENVIADO CONDOMINIO",
          direction: "debit",
          subcategory: { type: "product", id: "housing.rent" },
        },
        userA.id,
      );
      const manualTarget = await transactionIdFor(db, "prov-4");
      await categorization.setManual(
        db,
        manualTarget,
        { type: "product", id: "other.donations" },
        userA.id,
      );

      const props = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      const byDescription = new Map(props.transactions.map((row) => [row.description, row]));

      expect(byDescription.get("SALARIO EMPRESA X")?.category).toEqual({
        label: t.subcategories["income.salary"],
        categoryLabel: t.categories.income,
        sourceLabel: t.category.sources.provider,
      });
      expect(byDescription.get("IOF SOBRE COMPRA INTERNACIONAL")?.category).toEqual({
        label: t.subcategories["financial.taxes"],
        categoryLabel: t.categories.financial,
        sourceLabel: t.category.sources.default,
      });
      expect(byDescription.get("PIX ENVIADO CONDOMINIO RESIDENCIAL")?.category).toEqual({
        label: t.subcategories["housing.rent"],
        categoryLabel: t.categories.housing,
        sourceLabel: t.category.sources.rule,
      });
      expect(byDescription.get("PIX ENVIADO CONDOMINIO GARAGEM")?.category).toEqual({
        label: t.subcategories["other.donations"],
        categoryLabel: t.categories.other,
        sourceLabel: t.category.sources.manual,
      });
    });
  });

  it("computes the uncategorized summary over the whole month even when the row sits on another page", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const categorized = Array.from({ length: TRANSACTIONS_PAGE_SIZE }, (_, index) =>
        seedTransaction({
          providerTransactionId: `cat-${String(index)}`,
          date: "2026-09-20",
          description: `SALARIO LOTE ${String(index)}`,
          providerCategory: "Salary",
          type: "credit",
          amountCentavos: 1000 + index,
        }),
      );
      const uncategorized = seedTransaction({
        providerTransactionId: "uncategorized-1",
        date: "2026-09-01",
        description: "TRANSACAO DESCONHECIDA",
        providerCategory: null,
        type: "debit",
        amountCentavos: -12345,
      });

      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [...categorized, uncategorized],
      });

      const props = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);

      expect(props.total).toBe(TRANSACTIONS_PAGE_SIZE + 1);
      expect(props.transactions).toHaveLength(TRANSACTIONS_PAGE_SIZE);
      expect(props.hasMore).toBe(true);
      expect(props.transactions.some((row) => row.description === "TRANSACAO DESCONHECIDA")).toBe(
        false,
      );
      expect(props.uncategorized).toEqual({
        count: 1,
        amountLabel: formatMoney({ amountCentavos: 12345, currency: "BRL" }),
      });
    });
  });

  it("filters to uncategorized rows only when categoria=sem, keeping the total and the summary in sync", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "u-1",
            date: "2026-09-02",
            description: "GASTO 1",
            providerCategory: null,
            type: "debit",
            amountCentavos: -1000,
          }),
          seedTransaction({
            providerTransactionId: "u-2",
            date: "2026-09-03",
            description: "GASTO 2",
            providerCategory: null,
            type: "debit",
            amountCentavos: -2000,
          }),
          seedTransaction({
            providerTransactionId: "u-3",
            date: "2026-09-04",
            description: "GASTO 3",
            providerCategory: null,
            type: "debit",
            amountCentavos: -3000,
          }),
          seedTransaction({
            providerTransactionId: "cat-1",
            date: "2026-09-05",
            description: "SALARIO",
            providerCategory: "Salary",
            type: "credit",
            amountCentavos: 500000,
          }),
        ],
      });

      const all = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      expect(all.total).toBe(4);
      expect(all.uncategorized.count).toBe(3);

      const filtered = await getTransactionsPageProps(
        userA.session,
        { mes: "2026-09", categoria: "sem" },
        NOW,
      );
      expect(filtered.uncategorizedOnly).toBe(true);
      expect(filtered.total).toBe(3);
      expect(filtered.transactions).toHaveLength(3);
      expect(filtered.transactions.every((row) => row.category === null)).toBe(true);
      expect(filtered.uncategorized).toEqual(all.uncategorized);
    });
  });

  it("never lets another household's rules or manual choices change these rows", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "iso-1",
            date: "2026-09-10",
            description: "PIX ENVIADO CONDOMINIO RESIDENCIAL",
            providerCategory: null,
            type: "debit",
            amountCentavos: -1000,
          }),
        ],
      });
      await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: "household-b-item",
        transactions: [
          seedTransaction({
            providerTransactionId: "iso-2",
            date: "2026-09-11",
            description: "OUTRA TRANSACAO",
            providerCategory: null,
            type: "debit",
            amountCentavos: -2000,
          }),
        ],
      });

      const categorizationB = createCategorizationRepository(householdScope(userB.session));
      await categorizationB.saveRule(
        db,
        {
          pattern: "CONDOMINIO",
          direction: "debit",
          subcategory: { type: "product", id: "leisure.gaming" },
        },
        userB.id,
      );
      const bTransactionId = await transactionIdFor(db, "iso-2");
      await categorizationB.setManual(
        db,
        bTransactionId,
        { type: "product", id: "housing.condo" },
        userB.id,
      );

      const props = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      const row = props.transactions.find(
        (transaction) => transaction.description === "PIX ENVIADO CONDOMINIO RESIDENCIAL",
      );

      expect(row?.category).toEqual({
        label: t.subcategories["housing.condo"],
        categoryLabel: t.categories.housing,
        sourceLabel: t.category.sources.default,
      });
      expect(props.uncategorized.count).toBe(0);
    });
  });
});
