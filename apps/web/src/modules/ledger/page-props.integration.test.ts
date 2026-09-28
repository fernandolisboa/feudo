import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { formatMoney } from "@feudo/core";

import { householdScope } from "@/modules/households";
import { bankTransaction } from "@/modules/sync/schema";
import {
  moveSeededAccount,
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";

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

  it("falls back a total's currency to the listed rows' own currency, not always BRL (design contract's #16 review, item 8)", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "usd-income",
            date: "2026-09-05",
            description: "SALARIO EMPRESA X",
            providerCategory: "Salary",
            type: "credit",
            amountCentavos: 500000,
            currency: "USD",
          }),
        ],
      });

      const props = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);

      expect(props.totals.incomeLabel).toBe(
        formatMoney({ amountCentavos: 500000, currency: "USD" }),
      );
      expect(props.totals.spendingLabel).toBe(formatMoney({ amountCentavos: 0, currency: "USD" }));
    });
  });

  it("falls back to BRL when the month has no listed rows at all", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, { household: householdScope(userA.session) });

      const props = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);

      expect(props.totals.incomeLabel).toBe(formatMoney({ amountCentavos: 0, currency: "BRL" }));
      expect(props.totals.spendingLabel).toBe(formatMoney({ amountCentavos: 0, currency: "BRL" }));
    });
  });

  it("prefills the category dialog from a member's stored manual choice, never the derived transfer subcategory a mark forces (design contract's #16 review, item 9)", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "manual-plus-mark",
            date: "2026-09-05",
            description: "COMPRA CARTAO MERCADO",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -9900,
          }),
        ],
      });
      const categorization = createCategorizationRepository(householdScope(userA.session));
      const transactionId = await transactionIdFor(db, "manual-plus-mark");
      await categorization.setManual(
        db,
        transactionId,
        { type: "product", id: "food.groceries" },
        userA.id,
      );
      await categorization.setTransferMark(db, transactionId, true, userA.id);

      const props = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      const row = props.transactions.find((transaction) => transaction.id === transactionId);

      expect(row?.categorize.subcategoryValue).toBe("product:food.groceries");
    });
  });

  it("detects a pair between two of the household's own accounts and excludes it from income and spending, counting its two transactions as transfers", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [seedAccount(), seedAccount({ providerAccountId: "acc-2", name: "Poupança" })],
        transactions: [
          seedTransaction({
            providerTransactionId: "pair-debit",
            providerAccountId: "acc-1",
            date: "2026-09-10",
            description: "TRANSFERENCIA CASA",
            type: "debit",
            amountCentavos: -50000,
          }),
          seedTransaction({
            providerTransactionId: "pair-credit",
            providerAccountId: "acc-2",
            date: "2026-09-10",
            description: "TRANSFERENCIA CASA",
            type: "credit",
            amountCentavos: 50000,
          }),
          seedTransaction({
            providerTransactionId: "income-1",
            providerAccountId: "acc-1",
            date: "2026-09-05",
            description: "SALARIO EMPRESA X",
            providerCategory: "Salary",
            type: "credit",
            amountCentavos: 500000,
          }),
          seedTransaction({
            providerTransactionId: "spending-1",
            providerAccountId: "acc-1",
            date: "2026-09-06",
            description: "COMPRA NO MERCADO",
            providerCategory: "Groceries",
            type: "debit",
            amountCentavos: -20000,
          }),
        ],
      });

      const props = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      const pairRows = props.transactions.filter((row) => row.description === "TRANSFERENCIA CASA");
      expect(pairRows).toHaveLength(2);
      expect(pairRows.every((row) => row.categorize.isInternalTransfer)).toBe(true);
      expect(pairRows.every((row) => !row.categorize.hasTransferMark)).toBe(true);

      expect(props.totals).toEqual({
        incomeLabel: formatMoney({ amountCentavos: 500000, currency: "BRL" }),
        spendingLabel: formatMoney({ amountCentavos: 20000, currency: "BRL" }),
        transferCount: 2,
      });
    });
  });

  it("pairs a transaction once its counterpart's account moves into the household, and unpairs both once it moves back out", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({
            providerTransactionId: "move-pair-a",
            date: "2026-09-10",
            description: "TRANSFERENCIA CASA",
            type: "debit",
            amountCentavos: -50000,
          }),
        ],
      });
      const seededB = await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: "household-b-item",
        transactions: [
          seedTransaction({
            providerTransactionId: "move-pair-b",
            date: "2026-09-10",
            description: "TRANSFERENCIA CASA",
            type: "credit",
            amountCentavos: 50000,
          }),
        ],
      });
      const accountBId = seededB.accountIdsByProvider.get("acc-1") ?? "";

      const beforeMove = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      expect(
        beforeMove.transactions.find((row) => row.description === "TRANSFERENCIA CASA")?.categorize
          .isInternalTransfer,
      ).toBe(false);

      await joinHousehold(db, userB.id, householdA);
      expect(await moveSeededAccount(db, userB, accountBId, householdA)).toBe("ok");

      const afterMoveIn = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      const pairedRows = afterMoveIn.transactions.filter(
        (row) => row.description === "TRANSFERENCIA CASA",
      );
      expect(pairedRows).toHaveLength(2);
      expect(pairedRows.every((row) => row.categorize.isInternalTransfer)).toBe(true);

      expect(await moveSeededAccount(db, userB, accountBId, householdB)).toBe("ok");

      const afterMoveOutA = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      expect(
        afterMoveOutA.transactions.find((row) => row.description === "TRANSFERENCIA CASA")
          ?.categorize.isInternalTransfer,
      ).toBe(false);
      const afterMoveOutB = await getTransactionsPageProps(userB.session, { mes: "2026-09" }, NOW);
      expect(
        afterMoveOutB.transactions.find((row) => row.description === "TRANSFERENCIA CASA")
          ?.categorize.isInternalTransfer,
      ).toBe(false);
    });
  });

  it("lets a member's mark override a detected pair, and force a lone transaction into being one, at the read boundary", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [seedAccount(), seedAccount({ providerAccountId: "acc-2", name: "Poupança" })],
        transactions: [
          seedTransaction({
            providerTransactionId: "boundary-debit",
            providerAccountId: "acc-1",
            date: "2026-09-10",
            description: "TRANSFERENCIA CASA",
            type: "debit",
            amountCentavos: -50000,
          }),
          seedTransaction({
            providerTransactionId: "boundary-credit",
            providerAccountId: "acc-2",
            date: "2026-09-10",
            description: "TRANSFERENCIA CASA",
            type: "credit",
            amountCentavos: 50000,
          }),
          seedTransaction({
            providerTransactionId: "boundary-lone",
            providerAccountId: "acc-1",
            date: "2026-09-12",
            description: "SAQUE PARA GUARDAR EM CASA",
            providerCategory: null,
            type: "debit",
            amountCentavos: -3000,
          }),
        ],
      });

      const categorization = createCategorizationRepository(householdScope(userA.session));
      const debitId = await transactionIdFor(db, "boundary-debit");
      const loneId = await transactionIdFor(db, "boundary-lone");
      expect(await categorization.setTransferMark(db, debitId, false, userA.id)).toBe("ok");
      expect(await categorization.setTransferMark(db, loneId, true, userA.id)).toBe("ok");

      const props = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      const byId = new Map(props.transactions.map((row) => [row.id, row]));

      expect(byId.get(debitId)?.categorize.isInternalTransfer).toBe(false);
      const creditId = await transactionIdFor(db, "boundary-credit");
      expect(byId.get(creditId)?.categorize.isInternalTransfer).toBe(false);
      expect(byId.get(loneId)?.categorize.isInternalTransfer).toBe(true);
      expect(props.totals.transferCount).toBe(1);
    });
  });

  it("never confirms or rejects a pair using another household's account-holder hash (design contract's #16 review, item 11)", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userB, {
        household: householdScope(userB.session),
        itemId: "household-b-item",
        accounts: [seedAccount({ holderDocumentHash: "hash-b-holder" })],
      });

      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        accounts: [
          seedAccount({ providerAccountId: "acc-1", name: "Conta 1", holderDocumentHash: null }),
          seedAccount({ providerAccountId: "acc-2", name: "Conta 2", holderDocumentHash: null }),
          seedAccount({ providerAccountId: "acc-3", name: "Conta 3", holderDocumentHash: null }),
          seedAccount({
            providerAccountId: "acc-4",
            name: "Conta 4",
            holderDocumentHash: "hash-a-4",
          }),
          seedAccount({ providerAccountId: "acc-5", name: "Conta 5", holderDocumentHash: null }),
          seedAccount({
            providerAccountId: "acc-6",
            name: "Conta 6",
            holderDocumentHash: "hash-a-6",
          }),
        ],
        transactions: [
          // A's holder set never includes household B's hash, so a
          // counterpart matching it (and no known holder on the receiving
          // side) is unconfirmed evidence, not a confirmation.
          seedTransaction({
            providerTransactionId: "sec-unconfirmed-debit",
            providerAccountId: "acc-1",
            date: "2026-09-10",
            description: "TRANSFERENCIA 1",
            type: "debit",
            amountCentavos: -10000,
            counterpartType: "cpf",
            counterpartDocumentHash: "hash-b-holder",
          }),
          seedTransaction({
            providerTransactionId: "sec-unconfirmed-credit",
            providerAccountId: "acc-2",
            date: "2026-09-10",
            description: "TRANSFERENCIA 1",
            type: "credit",
            amountCentavos: 10000,
          }),
          // The receiving account's own holder is known and different, so a
          // CPF counterpart equal to household B's holder rejects the pair.
          seedTransaction({
            providerTransactionId: "sec-rejected-debit",
            providerAccountId: "acc-3",
            date: "2026-09-11",
            description: "TRANSFERENCIA 2",
            type: "debit",
            amountCentavos: -20000,
            counterpartType: "cpf",
            counterpartDocumentHash: "hash-b-holder",
          }),
          seedTransaction({
            providerTransactionId: "sec-rejected-credit",
            providerAccountId: "acc-4",
            date: "2026-09-11",
            description: "TRANSFERENCIA 2",
            type: "credit",
            amountCentavos: 20000,
          }),
          // The same shape, but the counterpart hash matches the receiving
          // account's own holder: confirms.
          seedTransaction({
            providerTransactionId: "sec-confirmed-debit",
            providerAccountId: "acc-5",
            date: "2026-09-12",
            description: "TRANSFERENCIA 3",
            type: "debit",
            amountCentavos: -30000,
            counterpartType: "cpf",
            counterpartDocumentHash: "hash-a-6",
          }),
          seedTransaction({
            providerTransactionId: "sec-confirmed-credit",
            providerAccountId: "acc-6",
            date: "2026-09-12",
            description: "TRANSFERENCIA 3",
            type: "credit",
            amountCentavos: 30000,
          }),
        ],
      });

      const props = await getTransactionsPageProps(userA.session, { mes: "2026-09" }, NOW);
      const rowsFor = (description: string) =>
        props.transactions.filter((row) => row.description === description);

      const unconfirmed = rowsFor("TRANSFERENCIA 1");
      expect(unconfirmed).toHaveLength(2);
      expect(unconfirmed.every((row) => row.categorize.isInternalTransfer)).toBe(true);

      const rejected = rowsFor("TRANSFERENCIA 2");
      expect(rejected).toHaveLength(2);
      expect(rejected.every((row) => !row.categorize.isInternalTransfer)).toBe(true);

      const confirmed = rowsFor("TRANSFERENCIA 3");
      expect(confirmed).toHaveLength(2);
      expect(confirmed.every((row) => row.categorize.isInternalTransfer)).toBe(true);
    });
  });
});
