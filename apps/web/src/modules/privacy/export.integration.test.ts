import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { financialDataAccess } from "@/modules/audit/schema";
import type { HouseholdSession } from "@/modules/households";
import {
  categorizationRule,
  householdSubcategory,
  internalTransferMark,
  transactionCategorization,
} from "@/modules/ledger/schema";
import { reserveMark } from "@/modules/reserve/schema";
import { bankAccount, bankTransaction, providerCredential } from "@/modules/sync/schema";
import {
  seedAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import {
  joinHousehold,
  seedHousehold,
  seedUser,
  type SeededUser,
} from "@/modules/sync/test/with-two-users";
import { withTestDb } from "@/platform/db/test/harness";

import type { Database } from "@/platform/db/client";
import { buildExportDocument } from "./export";
import { EXPORT_RATE_LIMIT, handleExportRequest } from "./export-request";

const NOW = new Date("2026-10-03T12:00:00.000Z");

function sessionInHousehold(seeded: SeededUser, householdId: string): HouseholdSession {
  return { ...seeded.session, householdId };
}

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

async function seedCasa(db: Database) {
  const householdA = await seedHousehold(db, "Casa A");
  const ana = await seedUser(db, "Ana", householdA);

  const householdB = await seedHousehold(db, "Casa B");
  const biaSeed = await seedUser(db, "Bia", householdB);
  await joinHousehold(db, biaSeed.id, householdA, "member");
  const bia: SeededUser = { ...biaSeed, session: sessionInHousehold(biaSeed, householdA) };

  const connectionA = await seedSyncedConnection(db, ana, {
    household: { householdId: householdA },
    itemId: "item-ana",
    accounts: [seedAccount({ providerAccountId: "ana-checking", name: "Conta da Ana" })],
    transactions: [
      seedTransaction({
        providerTransactionId: "ana-t1",
        providerAccountId: "ana-checking",
        description: "SUPERMERCADO ANA",
        date: "2026-09-10",
      }),
    ],
  });
  const connectionB = await seedSyncedConnection(db, bia, {
    household: { householdId: householdA },
    itemId: "item-bia",
    accounts: [seedAccount({ providerAccountId: "bia-checking", name: "Conta da Bia" })],
    transactions: [
      seedTransaction({
        providerTransactionId: "bia-t1",
        providerAccountId: "bia-checking",
        description: "SUPERMERCADO BIA",
        date: "2026-09-11",
      }),
    ],
  });

  for (const owner of [ana, bia]) {
    await db.insert(providerCredential).values({
      userId: owner.id,
      provider: "pluggy",
      ciphertext: `ciphertext-${owner.id}`,
      lastValidatedAt: NOW,
    });
  }

  const anaAccountId = connectionA.accountIdsByProvider.get("ana-checking");
  const biaAccountId = connectionB.accountIdsByProvider.get("bia-checking");
  if (!anaAccountId || !biaAccountId) {
    throw new Error("seed did not create the expected accounts");
  }

  const anaTransactionId = await transactionIdFor(db, "ana-t1");
  const biaTransactionId = await transactionIdFor(db, "bia-t1");

  return {
    householdA,
    householdB,
    ana,
    bia,
    anaAccountId,
    biaAccountId,
    anaTransactionId,
    biaTransactionId,
  };
}

describe("buildExportDocument (integration)", () => {
  it("isolation: never includes another member's connections, accounts, transactions, name, email or households", async () => {
    await withTestDb(async (db) => {
      const { householdA, householdB, ana, bia, anaTransactionId, biaTransactionId } =
        await seedCasa(db);

      await db.insert(householdSubcategory).values({
        id: "household-sub-mercado",
        householdId: householdA,
        categoryId: "custom",
        name: "Mercado da casa",
        kind: "variable",
      });

      // Ana categorizes and marks one of Bia's transactions; Bia does the
      // same on one of Ana's. Each also annotates their own.
      await db.insert(transactionCategorization).values([
        {
          transactionId: anaTransactionId,
          productSubcategoryId: "leisure.cinema",
          categorizedByUserId: ana.id,
          categorizedAt: NOW,
        },
        {
          transactionId: biaTransactionId,
          householdSubcategoryId: "household-sub-mercado",
          subcategoryHouseholdId: householdA,
          categorizedByUserId: ana.id,
          categorizedAt: NOW,
        },
      ]);
      await db.insert(internalTransferMark).values([
        {
          transactionId: biaTransactionId,
          isInternalTransfer: true,
          markedByUserId: ana.id,
          markedAt: NOW,
        },
        {
          transactionId: anaTransactionId,
          isInternalTransfer: false,
          markedByUserId: bia.id,
          markedAt: NOW,
        },
      ]);
      await db.insert(categorizationRule).values([
        {
          id: "rule-ana",
          householdId: householdA,
          pattern: "UBER",
          productSubcategoryId: "transport.ride_hailing",
          createdByUserId: ana.id,
          createdAt: NOW,
        },
        {
          id: "rule-bia",
          householdId: householdA,
          pattern: "NETFLIX",
          productSubcategoryId: "leisure.streaming",
          createdByUserId: bia.id,
          createdAt: NOW,
        },
      ]);

      const document = await buildExportDocument(sessionInHousehold(ana, householdA), NOW);

      expect(document.user.email).toBe(ana.session.email);
      expect(document.households.map((h) => h.householdId)).toEqual([householdA]);
      expect(document.households.some((h) => h.householdId === householdB)).toBe(false);

      expect(document.bankConnections).toHaveLength(1);
      expect(document.bankConnections[0]?.institutionName).not.toContain("Bia");
      expect(document.accounts.map((a) => a.name)).toEqual(["Conta da Ana"]);
      expect(document.transactions.map((t) => t.description)).toEqual(["SUPERMERCADO ANA"]);

      // Ana's own categorization and mark, plus her annotation on Bia's
      // transaction (opaque id only, nothing of Bia's transaction content).
      const categorizationIds = document.annotations.categorizations.map((c) => c.transactionId);
      expect(categorizationIds.sort()).toEqual([anaTransactionId, biaTransactionId].sort());
      const onBiasTransaction = document.annotations.categorizations.find(
        (c) => c.transactionId === biaTransactionId,
      );
      expect(onBiasTransaction).toEqual({
        transactionId: biaTransactionId,
        productSubcategoryId: null,
        householdSubcategoryId: "household-sub-mercado",
        householdSubcategoryName: "Mercado da casa",
        categorizedAt: NOW.toISOString(),
      });
      expect(JSON.stringify(document)).not.toContain("SUPERMERCADO BIA");
      expect(JSON.stringify(document)).not.toContain(bia.session.email);
      expect(JSON.stringify(document)).not.toContain(bia.session.name);

      // Only the mark Ana herself made (on Bia's transaction) is hers to
      // export; Bia's own mark on Ana's transaction belongs to Bia's export.
      expect(document.annotations.internalTransferMarks).toEqual([
        { transactionId: biaTransactionId, isInternalTransfer: true, markedAt: NOW.toISOString() },
      ]);
      expect(document.annotations.categorizationRules.map((r) => r.id)).toEqual(["rule-ana"]);

      expect(document.providerCredentials).toHaveLength(1);
      expect(document.providerCredentials[0]?.provider).toBe("pluggy");
      expect(document.providerCredentials[0]?.lastValidatedAt).toBe(NOW.toISOString());
      expect(typeof document.providerCredentials[0]?.createdAt).toBe("string");
      expect(JSON.stringify(document)).not.toContain("ciphertext");
    });
  });

  it("isolation: reserve marks are scoped to the user who updated them", async () => {
    await withTestDb(async (db) => {
      const { householdA, ana, bia, anaAccountId, biaAccountId } = await seedCasa(db);

      await db.insert(reserveMark).values([
        {
          householdId: householdA,
          accountId: anaAccountId,
          isReserve: true,
          liquidity: "daily",
          updatedByUserId: ana.id,
          updatedAt: NOW,
        },
        {
          householdId: householdA,
          accountId: biaAccountId,
          isReserve: true,
          liquidity: "daily",
          updatedByUserId: bia.id,
          updatedAt: NOW,
        },
      ]);

      const document = await buildExportDocument(sessionInHousehold(ana, householdA), NOW);

      expect(document.annotations.reserveMarks).toEqual([
        {
          householdId: householdA,
          accountId: anaAccountId,
          isReserve: true,
          liquidity: "daily",
          institutionId: null,
          updatedAt: NOW.toISOString(),
        },
      ]);
    });
  });

  it("includes an account assigned to no household, still scoped to its connection's owner", async () => {
    await withTestDb(async (db) => {
      const { householdA, ana, anaAccountId } = await seedCasa(db);
      await db
        .update(bankAccount)
        .set({ householdId: null })
        .where(eq(bankAccount.id, anaAccountId));

      const document = await buildExportDocument(sessionInHousehold(ana, householdA), NOW);

      const unassigned = document.accounts.find((account) => account.id === anaAccountId);
      expect(unassigned?.householdId).toBeNull();
    });
  });

  it("isolation: a user's own audit log across households never includes another user's rows", async () => {
    await withTestDb(async (db) => {
      const { householdA, householdB, ana, bia } = await seedCasa(db);
      await db.insert(financialDataAccess).values([
        { householdId: householdA, userId: ana.id, kind: "overview", accessedAt: NOW },
        { householdId: householdB, userId: bia.id, kind: "reserve", accessedAt: NOW },
      ]);

      const document = await buildExportDocument(sessionInHousehold(ana, householdA), NOW);

      expect(document.financialDataAccess).toEqual([
        { householdId: householdA, kind: "overview", accessedAt: NOW.toISOString() },
      ]);
    });
  });
});

describe("handleExportRequest rate limit (integration)", () => {
  it("allows up to the limit, refuses the next one within 24h, and records exactly one access per success", async () => {
    await withTestDb(async (db) => {
      const { householdA, ana } = await seedCasa(db);
      const session = sessionInHousehold(ana, householdA);
      const request = () => new Request("https://feudo.test/api/export", { method: "POST" });

      for (let i = 0; i < EXPORT_RATE_LIMIT; i += 1) {
        const response = await handleExportRequest(request(), {
          getSession: () => Promise.resolve(session),
        });
        expect(response.status).toBe(200);
      }

      const exportsBeforeFourth = await db
        .select()
        .from(financialDataAccess)
        .where(eq(financialDataAccess.userId, ana.id));
      expect(exportsBeforeFourth).toHaveLength(EXPORT_RATE_LIMIT);

      const fourth = await handleExportRequest(request(), {
        getSession: () => Promise.resolve(session),
      });
      expect(fourth.status).toBe(303);
      expect(fourth.headers.get("Location")).toBe(
        "https://feudo.test/preferencias?exportacao=limite",
      );

      const exportsAfterFourth = await db
        .select()
        .from(financialDataAccess)
        .where(eq(financialDataAccess.userId, ana.id));
      expect(exportsAfterFourth).toHaveLength(EXPORT_RATE_LIMIT);
    });
  });
});
