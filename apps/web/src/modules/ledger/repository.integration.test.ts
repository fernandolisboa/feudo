import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { member } from "@/modules/auth/schema";
import { householdScope } from "@/modules/households";
import { bankTransaction } from "@/modules/sync/schema";
import {
  moveSeededAccount,
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers, type TwoUsers } from "@/modules/sync/test/with-two-users";

import { createCategorizationRepository } from "./categorization-repository";
import { createHouseholdLedgerRepository } from "./repository";

import type { Database } from "@/platform/db/client";

const SEPTEMBER = { from: "2026-09-01", to: "2026-09-30" };
const AUGUST = { from: "2026-08-01", to: "2026-08-31" };

async function seedHouseholdLedger(db: Database, owner: TwoUsers["userA"], prefix: string) {
  return seedSyncedConnection(db, owner, {
    household: householdScope(owner.session),
    itemId: `${prefix}-item`,
    accounts: [
      seedAccount({ providerAccountId: `${prefix}-checking`, name: "Conta corrente" }),
      seedAccount({ providerAccountId: `${prefix}-savings`, name: "Poupança", type: "savings" }),
    ],
    transactions: [
      seedTransaction({
        providerTransactionId: `${prefix}-1`,
        providerAccountId: `${prefix}-checking`,
        date: "2026-09-16",
        amountCentavos: -98050,
        description: `${prefix} condominio`,
      }),
      seedTransaction({
        providerTransactionId: `${prefix}-2`,
        providerAccountId: `${prefix}-checking`,
        date: "2026-09-15",
        amountCentavos: 850000,
        type: "credit",
        description: `${prefix} salario`,
      }),
      seedTransaction({
        providerTransactionId: `${prefix}-3`,
        providerAccountId: `${prefix}-savings`,
        date: "2026-09-16",
        amountCentavos: -500,
        description: `${prefix} tarifa`,
      }),
      seedTransaction({
        providerTransactionId: `${prefix}-4`,
        providerAccountId: `${prefix}-checking`,
        date: "2026-08-31",
        amountCentavos: -1000,
        description: `${prefix} agosto`,
      }),
    ],
  });
}

describe("household ledger repository (integration)", () => {
  it("lists only the scoped household's accounts and transactions", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedHouseholdLedger(db, userA, "a");
      await seedHouseholdLedger(db, userB, "b");
      const ledgerA = createHouseholdLedgerRepository(householdScope(userA.session));
      const ledgerB = createHouseholdLedgerRepository(householdScope(userB.session));

      const pageA = await ledgerA.listTransactionsInRange(db, { days: SEPTEMBER, accountId: null });
      expect(pageA.map((transaction) => transaction.description)).toEqual([
        "a condominio",
        "a tarifa",
        "a salario",
      ]);
      expect(pageA[0]).toMatchObject({
        accountName: "Conta corrente",
        institutionName: "Banco Fixture",
        currency: "BRL",
        type: "debit",
        providerCategory: null,
        manual: null,
      });
      expect(
        await ledgerA.listTransactionsInRange(db, { days: SEPTEMBER, accountId: null }),
      ).toHaveLength(3);
      expect(
        await ledgerB.listTransactionsInRange(db, { days: SEPTEMBER, accountId: null }),
      ).toHaveLength(3);
      expect(
        (await ledgerB.listTransactionsInRange(db, { days: SEPTEMBER, accountId: null })).every(
          (transaction) => transaction.description.startsWith("b "),
        ),
      ).toBe(true);
      expect((await ledgerA.listAccounts(db)).map((account) => account.name)).toEqual([
        "Conta corrente",
        "Poupança",
      ]);
    });
  });

  it("ignores another household's account id used as a filter", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedHouseholdLedger(db, userA, "a");
      const seededB = await seedHouseholdLedger(db, userB, "b");
      const ledgerA = createHouseholdLedgerRepository(householdScope(userA.session));
      const accountOfB = seededB.accountIdsByProvider.get("b-checking") ?? "";

      expect(
        await ledgerA.listTransactionsInRange(db, { days: SEPTEMBER, accountId: accountOfB }),
      ).toEqual([]);
    });
  });

  it("shows an unassigned account's transactions to nobody", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [seedTransaction()],
      });
      await db.delete(member).where(eq(member.userId, userA.id));

      for (const user of [userA, userB]) {
        const ledger = createHouseholdLedgerRepository(householdScope(user.session));
        expect(await ledger.listAccounts(db)).toEqual([]);
        expect(
          await ledger.listTransactionsInRange(db, { days: SEPTEMBER, accountId: null }),
        ).toEqual([]);
      }
    });
  });

  it("stops showing a departed member's transactions and shows them where the account moves", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      const membershipInA = await joinHousehold(db, userB.id, householdA);
      const seeded = await seedSyncedConnection(db, userB, {
        household: { householdId: householdA },
        transactions: [seedTransaction()],
      });
      const ledgerA = createHouseholdLedgerRepository(householdScope(userA.session));
      const ledgerB = createHouseholdLedgerRepository(householdScope(userB.session));
      const all = { days: SEPTEMBER, accountId: null };
      expect(await ledgerA.listTransactionsInRange(db, all)).toHaveLength(1);

      await db.delete(member).where(eq(member.id, membershipInA));
      expect(await ledgerA.listTransactionsInRange(db, all)).toHaveLength(0);
      expect(await ledgerB.listTransactionsInRange(db, all)).toHaveLength(0);

      const accountId = seeded.accountIdsByProvider.get("acc-1") ?? "";
      expect(await moveSeededAccount(db, userB, accountId, householdB)).toBe("ok");
      expect(await ledgerA.listTransactionsInRange(db, all)).toHaveLength(0);
      expect(await ledgerB.listTransactionsInRange(db, all)).toHaveLength(1);
    });
  });

  it("filters by month and account", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const seeded = await seedHouseholdLedger(db, userA, "a");
      const ledger = createHouseholdLedgerRepository(householdScope(userA.session));
      const checking = seeded.accountIdsByProvider.get("a-checking") ?? "";

      const august = await ledger.listTransactionsInRange(db, { days: AUGUST, accountId: null });
      expect(august.map((transaction) => transaction.description)).toEqual(["a agosto"]);

      const checkingOnly = await ledger.listTransactionsInRange(db, {
        days: SEPTEMBER,
        accountId: checking,
      });
      expect(checkingOnly.map((transaction) => transaction.description)).toEqual([
        "a condominio",
        "a salario",
      ]);
    });
  });

  it("resolves the household's own manual categorization onto a transaction", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedHouseholdLedger(db, userA, "a");
      const transactionId = (
        await db
          .select({ id: bankTransaction.id })
          .from(bankTransaction)
          .where(eq(bankTransaction.providerTransactionId, "a-1"))
      )[0]?.id;
      if (!transactionId) {
        throw new Error("seed did not create the expected transaction");
      }
      const categorization = createCategorizationRepository(householdScope(userA.session));
      expect(
        await categorization.setManual(
          db,
          transactionId,
          { type: "product", id: "housing.condo" },
          userA.id,
        ),
      ).toBe("ok");

      const ledgerA = createHouseholdLedgerRepository(householdScope(userA.session));
      const rows = await ledgerA.listTransactionsInRange(db, { days: SEPTEMBER, accountId: null });
      const categorized = rows.find((transaction) => transaction.id === transactionId);
      expect(categorized?.manual).toEqual({ type: "product", id: "housing.condo" });
      expect(rows.filter((transaction) => transaction.id !== transactionId)).toSatisfy(
        (others: typeof rows) => others.every((transaction) => transaction.manual === null),
      );
    });
  });
});
