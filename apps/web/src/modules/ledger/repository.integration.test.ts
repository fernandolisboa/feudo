import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { member } from "@/modules/auth/schema";
import { householdScope } from "@/modules/households";
import {
  moveSeededAccount,
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers, type TwoUsers } from "@/modules/sync/test/with-two-users";

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

      const pageA = await ledgerA.listTransactions(
        db,
        { days: SEPTEMBER, accountId: null },
        { number: 1, size: 50 },
      );
      expect(pageA.hasMore).toBe(false);
      expect(pageA.transactions.map((transaction) => transaction.description)).toEqual([
        "a condominio",
        "a tarifa",
        "a salario",
      ]);
      expect(pageA.transactions[0]).toMatchObject({
        accountName: "Conta corrente",
        institutionName: "Banco Fixture",
        currency: "BRL",
        type: "debit",
      });
      expect(await ledgerA.countTransactions(db, { days: SEPTEMBER, accountId: null })).toBe(3);
      expect(await ledgerB.countTransactions(db, { days: SEPTEMBER, accountId: null })).toBe(3);
      expect(
        (
          await ledgerB.listTransactions(
            db,
            { days: SEPTEMBER, accountId: null },
            { number: 1, size: 50 },
          )
        ).transactions.every((transaction) => transaction.description.startsWith("b ")),
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

      expect(await ledgerA.countTransactions(db, { days: SEPTEMBER, accountId: accountOfB })).toBe(
        0,
      );
      expect(
        (
          await ledgerA.listTransactions(
            db,
            { days: SEPTEMBER, accountId: accountOfB },
            { number: 1, size: 50 },
          )
        ).transactions,
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
        expect(await ledger.countTransactions(db, { days: SEPTEMBER, accountId: null })).toBe(0);
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
      expect(await ledgerA.countTransactions(db, all)).toBe(1);

      await db.delete(member).where(eq(member.id, membershipInA));
      expect(await ledgerA.countTransactions(db, all)).toBe(0);
      expect(await ledgerB.countTransactions(db, all)).toBe(0);

      const accountId = seeded.accountIdsByProvider.get("acc-1") ?? "";
      expect(await moveSeededAccount(db, userB, accountId, householdB)).toBe("ok");
      expect(await ledgerA.countTransactions(db, all)).toBe(0);
      expect(await ledgerB.countTransactions(db, all)).toBe(1);
    });
  });

  it("filters by month and account, and pages with a look-ahead", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const seeded = await seedHouseholdLedger(db, userA, "a");
      const ledger = createHouseholdLedgerRepository(householdScope(userA.session));
      const checking = seeded.accountIdsByProvider.get("a-checking") ?? "";

      const august = await ledger.listTransactions(
        db,
        { days: AUGUST, accountId: null },
        { number: 1, size: 50 },
      );
      expect(august.transactions.map((transaction) => transaction.description)).toEqual([
        "a agosto",
      ]);

      const checkingOnly = await ledger.listTransactions(
        db,
        { days: SEPTEMBER, accountId: checking },
        { number: 1, size: 50 },
      );
      expect(checkingOnly.transactions.map((transaction) => transaction.description)).toEqual([
        "a condominio",
        "a salario",
      ]);

      const firstPage = await ledger.listTransactions(
        db,
        { days: SEPTEMBER, accountId: null },
        { number: 1, size: 2 },
      );
      const secondPage = await ledger.listTransactions(
        db,
        { days: SEPTEMBER, accountId: null },
        { number: 2, size: 2 },
      );
      expect(firstPage).toMatchObject({ hasMore: true });
      expect(firstPage.transactions).toHaveLength(2);
      expect(secondPage).toMatchObject({ hasMore: false });
      expect(secondPage.transactions.map((transaction) => transaction.description)).toEqual([
        "a salario",
      ]);
    });
  });
});
