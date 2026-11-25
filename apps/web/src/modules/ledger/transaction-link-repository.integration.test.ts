import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { householdScope } from "@/modules/households";
import { bankTransaction } from "@/modules/sync/schema";
import {
  moveSeededAccount,
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";

import { createTransactionLinkRepository } from "./transaction-link-repository";
import { transactionLink } from "./schema";

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

async function seedPair(
  db: Database,
  owner: Parameters<typeof seedSyncedConnection>[1],
  household: Parameters<typeof seedSyncedConnection>[2]["household"],
  overrides: { debitAmount?: number; creditAmount?: number; sameAccount?: boolean } = {},
): Promise<{ debitTransactionId: string; creditTransactionId: string; accountId: string }> {
  const debitAmount = overrides.debitAmount ?? -5000;
  const creditAmount = overrides.creditAmount ?? 5000;
  const connection = await seedSyncedConnection(db, owner, {
    household,
    itemId: crypto.randomUUID(),
    accounts: [
      seedAccount({ providerAccountId: "acc-1" }),
      seedAccount({ providerAccountId: "acc-2", name: "Conta poupança" }),
    ],
    transactions: [
      seedTransaction({
        providerTransactionId: "debit-1",
        providerAccountId: "acc-1",
        type: "debit",
        amountCentavos: debitAmount,
        description: "PAGAMENTO FATURA",
      }),
      seedTransaction({
        providerTransactionId: "credit-1",
        providerAccountId: overrides.sameAccount === false ? "acc-2" : "acc-1",
        type: "credit",
        amountCentavos: creditAmount,
        description: "RESGATE RDB",
      }),
    ],
  });
  const debitTransactionId = await transactionIdFor(db, "debit-1");
  const creditTransactionId = await transactionIdFor(db, "credit-1");
  const accountId = connection.accountIdsByProvider.get("acc-1") ?? "";
  return { debitTransactionId, creditTransactionId, accountId };
}

describe("transaction link repository (integration)", () => {
  it("confirms a link only through both transactions' own household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const { debitTransactionId, creditTransactionId } = await seedPair(
        db,
        userA,
        householdScope(userA.session),
      );
      const repoA = createTransactionLinkRepository(householdScope(userA.session));
      const repoB = createTransactionLinkRepository(householdScope(userB.session));

      expect(
        await repoB.confirm(
          db,
          { debitTransactionId, creditTransactionId, kind: "offset" },
          userB.id,
        ),
      ).toBe("not_found");
      expect(await repoB.listConfirmedLinks(db)).toEqual([]);

      expect(
        await repoA.confirm(
          db,
          { debitTransactionId, creditTransactionId, kind: "offset" },
          userA.id,
        ),
      ).toBe("ok");
      expect(await repoA.listConfirmedLinks(db)).toEqual([
        { debitTransactionId, creditTransactionId, kind: "offset" },
      ]);
    });
  });

  it("refuses to confirm a pair that is not a valid link shape, writing nothing", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repoA = createTransactionLinkRepository(householdScope(userA.session));

      const differentAccounts = await seedPair(db, userA, householdScope(userA.session), {
        sameAccount: false,
      });
      expect(
        await repoA.confirm(
          db,
          {
            debitTransactionId: differentAccounts.debitTransactionId,
            creditTransactionId: differentAccounts.creditTransactionId,
            kind: "offset",
          },
          userA.id,
        ),
      ).toBe("not_found");

      const unequalAmounts = await seedPair(db, userA, householdScope(userA.session), {
        debitAmount: -5000,
        creditAmount: 6000,
      });
      expect(
        await repoA.confirm(
          db,
          {
            debitTransactionId: unequalAmounts.debitTransactionId,
            creditTransactionId: unequalAmounts.creditTransactionId,
            kind: "offset",
          },
          userA.id,
        ),
      ).toBe("not_found");

      expect(await repoA.listConfirmedLinks(db)).toEqual([]);
    });
  });

  it("refuses to confirm a pair that is already linked, on either side", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const { debitTransactionId, creditTransactionId } = await seedPair(
        db,
        userA,
        householdScope(userA.session),
      );
      const repoA = createTransactionLinkRepository(householdScope(userA.session));

      expect(
        await repoA.confirm(
          db,
          { debitTransactionId, creditTransactionId, kind: "offset" },
          userA.id,
        ),
      ).toBe("ok");
      expect(
        await repoA.confirm(
          db,
          { debitTransactionId, creditTransactionId, kind: "offset" },
          userA.id,
        ),
      ).toBe("not_found");

      const rows = await db.select().from(transactionLink);
      expect(rows).toHaveLength(1);
    });
  });

  it("stops listing a confirmed link once one of its accounts leaves the reading household", async () => {
    await withTwoUsers(async ({ db, userA, householdB }) => {
      const { debitTransactionId, creditTransactionId, accountId } = await seedPair(
        db,
        userA,
        householdScope(userA.session),
      );
      const repoA = createTransactionLinkRepository(householdScope(userA.session));
      expect(
        await repoA.confirm(
          db,
          { debitTransactionId, creditTransactionId, kind: "offset" },
          userA.id,
        ),
      ).toBe("ok");
      expect(await repoA.listConfirmedLinks(db)).toHaveLength(1);

      await joinHousehold(db, userA.id, householdB);
      expect(await moveSeededAccount(db, userA, accountId, householdB)).toBe("ok");

      expect(await repoA.listConfirmedLinks(db)).toEqual([]);
    });
  });

  it("dismisses and lists dismissals only through the session's own household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const { debitTransactionId, creditTransactionId } = await seedPair(
        db,
        userA,
        householdScope(userA.session),
      );
      const repoA = createTransactionLinkRepository(householdScope(userA.session));
      const repoB = createTransactionLinkRepository(householdScope(userB.session));

      expect(await repoB.dismiss(db, debitTransactionId, creditTransactionId)).toBe("not_found");
      expect(await repoB.listDismissals(db)).toEqual([]);

      expect(await repoA.dismiss(db, debitTransactionId, creditTransactionId)).toBe("ok");
      expect(await repoA.listDismissals(db)).toEqual([{ debitTransactionId, creditTransactionId }]);
      expect(await repoB.listDismissals(db)).toEqual([]);
    });
  });

  it("undoes a confirmed link only through the transaction's own household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const { debitTransactionId, creditTransactionId } = await seedPair(
        db,
        userA,
        householdScope(userA.session),
      );
      const repoA = createTransactionLinkRepository(householdScope(userA.session));
      const repoB = createTransactionLinkRepository(householdScope(userB.session));
      expect(
        await repoA.confirm(
          db,
          { debitTransactionId, creditTransactionId, kind: "offset" },
          userA.id,
        ),
      ).toBe("ok");

      expect(await repoB.undo(db, debitTransactionId)).toBe("not_found");
      expect(await repoA.listConfirmedLinks(db)).toHaveLength(1);

      expect(await repoA.undo(db, creditTransactionId)).toBe("ok");
      expect(await repoA.listConfirmedLinks(db)).toEqual([]);
    });
  });
});
