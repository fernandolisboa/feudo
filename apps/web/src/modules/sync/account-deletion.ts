import { and, asc, count, eq, isNotNull, sql } from "drizzle-orm";
import { parseYearMonth, type YearMonth } from "@feudo/core";

import type { CurrentSession } from "@/modules/auth";

import type { DatabaseOrTransaction } from "@/platform/db/client";
import { createSyncUserRepository } from "./repository";
import { bankAccount, bankConnection, bankTransaction } from "./schema";
import { scopeForUser, userScope } from "./scope";

// ADR-0008: asking to delete the account destroys the provider credentials at
// once, before the grace starts, so nobody who asked to leave has their bank
// read for seven more days.
export async function destroyProviderCredentials(
  db: DatabaseOrTransaction,
  session: CurrentSession,
): Promise<void> {
  await createSyncUserRepository(userScope(session)).deleteCredential(db);
}

export type HouseholdDataLoss = { accounts: number; months: YearMonth[] };

// What each household loses when the session's user is hard-deleted: the
// accounts of their connections assigned to it, and every month in which
// those accounts have a transaction.
export async function describeHouseholdDataLoss(
  db: DatabaseOrTransaction,
  session: CurrentSession,
): Promise<Map<string, HouseholdDataLoss>> {
  const ownAccounts = and(
    eq(bankConnection.userId, session.userId),
    isNotNull(bankAccount.householdId),
  );
  const accountRows = await db
    .select({ householdId: bankAccount.householdId, accounts: count() })
    .from(bankAccount)
    .innerJoin(bankConnection, eq(bankConnection.id, bankAccount.connectionId))
    .where(ownAccounts)
    .groupBy(bankAccount.householdId);
  const month = sql<string>`to_char(${bankTransaction.date}, 'YYYY-MM')`;
  const monthRows = await db
    .selectDistinct({ householdId: bankAccount.householdId, month })
    .from(bankTransaction)
    .innerJoin(bankAccount, eq(bankAccount.id, bankTransaction.accountId))
    .innerJoin(bankConnection, eq(bankConnection.id, bankAccount.connectionId))
    .where(ownAccounts)
    .orderBy(asc(month));

  const losses = new Map<string, HouseholdDataLoss>();
  for (const row of accountRows) {
    if (row.householdId) {
      losses.set(row.householdId, { accounts: row.accounts, months: [] });
    }
  }
  for (const row of monthRows) {
    const loss = row.householdId ? losses.get(row.householdId) : undefined;
    loss?.months.push(parseYearMonth(row.month));
  }
  return losses;
}

// Runs inside the account purge's transaction, before the user row goes:
// the connections are deleted first, so their accounts and transactions
// cascade with them while each consent is still referenced by nothing but
// its own (restrict) connection row.
export async function deleteConnectionsForAccountPurge(
  db: DatabaseOrTransaction,
  userId: string,
): Promise<void> {
  await db.delete(bankConnection).where(eq(bankConnection.userId, scopeForUser(userId).userId));
}
