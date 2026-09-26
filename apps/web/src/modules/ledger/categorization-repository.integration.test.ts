import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { householdScope } from "@/modules/households";
import { bankTransaction } from "@/modules/sync/schema";
import {
  moveSeededAccount,
  seedSyncedConnection,
  seedTransaction,
} from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";

import { createCategorizationRepository } from "./categorization-repository";
import { createHouseholdLedgerRepository } from "./repository";

import type { Database } from "@/platform/db/client";

const SEPTEMBER = { from: "2026-09-01", to: "2026-09-30" };
const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

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

describe("categorization repository (integration)", () => {
  it("adds and lists a household's own subcategories, rejecting a case-insensitive duplicate", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repoA = createCategorizationRepository(householdScope(userA.session));
      const repoB = createCategorizationRepository(householdScope(userB.session));

      const created = await repoA.addHouseholdSubcategory(db, {
        categoryId: "shopping",
        name: "Presentes",
        kind: "variable",
      });
      expect(created.status).toBe("ok");

      expect(
        await repoA.addHouseholdSubcategory(db, {
          categoryId: "shopping",
          name: "presentes",
          kind: "fixed",
        }),
      ).toEqual({ status: "duplicate" });

      expect(
        (
          await repoA.addHouseholdSubcategory(db, {
            categoryId: "leisure",
            name: "Presentes",
            kind: "variable",
          })
        ).status,
      ).toBe("ok");

      expect(await repoA.listHouseholdSubcategories(db)).toHaveLength(2);
      expect(await repoB.listHouseholdSubcategories(db)).toEqual([]);
    });
  });

  it("overrides and resets a product subcategory's kind, scoped to the household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repoA = createCategorizationRepository(householdScope(userA.session));
      const repoB = createCategorizationRepository(householdScope(userB.session));

      expect(await repoA.setKind(db, { type: "product", id: "leisure.travel" }, "fixed")).toBe(
        "ok",
      );
      expect(await repoA.listKindOverrides(db)).toEqual(new Map([["leisure.travel", "fixed"]]));
      expect(await repoB.listKindOverrides(db)).toEqual(new Map());

      expect(await repoA.setKind(db, { type: "product", id: "leisure.travel" }, "variable")).toBe(
        "ok",
      );
      expect(await repoA.listKindOverrides(db)).toEqual(new Map());
    });
  });

  it("changes a household subcategory's kind only from its own household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repoA = createCategorizationRepository(householdScope(userA.session));
      const repoB = createCategorizationRepository(householdScope(userB.session));
      const created = await repoA.addHouseholdSubcategory(db, {
        categoryId: "shopping",
        name: "Presentes",
        kind: "variable",
      });
      if (created.status !== "ok") {
        throw new Error("setup failed");
      }

      expect(await repoA.setKind(db, { type: "household", id: created.id }, "fixed")).toBe("ok");
      expect((await repoA.listHouseholdSubcategories(db))[0]).toMatchObject({ kind: "fixed" });

      expect(await repoB.setKind(db, { type: "household", id: created.id }, "income")).toBe(
        "not_found",
      );
      expect((await repoA.listHouseholdSubcategories(db))[0]).toMatchObject({ kind: "fixed" });

      expect(await repoA.setKind(db, { type: "household", id: UNKNOWN_ID }, "fixed")).toBe(
        "not_found",
      );
    });
  });

  it("saves, upserts and deletes a rule, scoped to the household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repoA = createCategorizationRepository(householdScope(userA.session));
      const repoB = createCategorizationRepository(householdScope(userB.session));

      expect(
        await repoA.saveRule(
          db,
          {
            pattern: "CONDOMINIO",
            direction: "debit",
            subcategory: { type: "product", id: "housing.condo" },
          },
          userA.id,
        ),
      ).toBe("ok");
      const rulesA = await repoA.listRules(db);
      expect(rulesA).toHaveLength(1);
      expect(rulesA[0]).toMatchObject({
        pattern: "CONDOMINIO",
        direction: "debit",
        subcategory: { type: "product", id: "housing.condo" },
      });
      expect(await repoB.listRules(db)).toEqual([]);

      expect(
        await repoA.saveRule(
          db,
          {
            pattern: "CONDOMINIO",
            direction: "debit",
            subcategory: { type: "product", id: "housing.rent" },
          },
          userA.id,
        ),
      ).toBe("ok");
      const updated = await repoA.listRules(db);
      expect(updated).toHaveLength(1);
      expect(updated[0]?.subcategory).toEqual({ type: "product", id: "housing.rent" });

      const ruleId = updated[0]?.id ?? "";
      expect(await repoB.deleteRule(db, ruleId)).toBe("not_found");
      expect(await repoA.listRules(db)).toHaveLength(1);
      expect(await repoA.deleteRule(db, ruleId)).toBe("ok");
      expect(await repoA.listRules(db)).toEqual([]);
    });
  });

  it("refuses a rule that targets another household's own subcategory", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repoA = createCategorizationRepository(householdScope(userA.session));
      const repoB = createCategorizationRepository(householdScope(userB.session));
      const created = await repoB.addHouseholdSubcategory(db, {
        categoryId: "shopping",
        name: "Presentes",
        kind: "variable",
      });
      if (created.status !== "ok") {
        throw new Error("setup failed");
      }

      expect(
        await repoA.saveRule(
          db,
          {
            pattern: "PRESENTE",
            direction: null,
            subcategory: { type: "household", id: created.id },
          },
          userA.id,
        ),
      ).toBe("not_found");
      expect(await repoA.listRules(db)).toEqual([]);
    });
  });

  it("sets, upserts and clears a manual categorization only through the transaction's own household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [seedTransaction({ providerTransactionId: "a-1" })],
      });
      const transactionId = await transactionIdFor(db, "a-1");
      const repoA = createCategorizationRepository(householdScope(userA.session));
      const repoB = createCategorizationRepository(householdScope(userB.session));

      expect(
        await repoB.setManual(
          db,
          transactionId,
          { type: "product", id: "housing.condo" },
          userB.id,
        ),
      ).toBe("not_found");

      expect(
        await repoA.setManual(
          db,
          transactionId,
          { type: "product", id: "housing.condo" },
          userA.id,
        ),
      ).toBe("ok");
      expect(
        await repoA.setManual(db, transactionId, { type: "product", id: "housing.rent" }, userA.id),
      ).toBe("ok");

      const bSubcategory = await repoB.addHouseholdSubcategory(db, {
        categoryId: "shopping",
        name: "Presentes",
        kind: "variable",
      });
      if (bSubcategory.status !== "ok") {
        throw new Error("setup failed");
      }
      expect(
        await repoA.setManual(
          db,
          transactionId,
          { type: "household", id: bSubcategory.id },
          userA.id,
        ),
      ).toBe("not_found");

      expect(await repoB.clearManual(db, transactionId)).toBe("not_found");
      expect(await repoA.clearManual(db, transactionId)).toBe("ok");
      expect(await repoA.clearManual(db, transactionId)).toBe("not_found");
    });
  });

  it("does not let an unknown transaction id be categorized", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repoA = createCategorizationRepository(householdScope(userA.session));
      expect(
        await repoA.setManual(db, UNKNOWN_ID, { type: "product", id: "housing.condo" }, userA.id),
      ).toBe("not_found");
    });
  });

  it("does not carry a manual choice when its account moves to another household", async () => {
    await withTwoUsers(async ({ db, userA, householdB }) => {
      const seeded = await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [seedTransaction({ providerTransactionId: "move-1" })],
      });
      const transactionId = await transactionIdFor(db, "move-1");
      const repoA = createCategorizationRepository(householdScope(userA.session));
      expect(
        await repoA.setManual(
          db,
          transactionId,
          { type: "product", id: "housing.condo" },
          userA.id,
        ),
      ).toBe("ok");

      await joinHousehold(db, userA.id, householdB);
      const accountId = seeded.accountIdsByProvider.get("acc-1") ?? "";
      expect(await moveSeededAccount(db, userA, accountId, householdB)).toBe("ok");

      const ledgerA = createHouseholdLedgerRepository(householdScope(userA.session));
      const rowsA = await ledgerA.listTransactionsInRange(db, {
        days: SEPTEMBER,
        accountId: null,
      });
      expect(rowsA.find((row) => row.id === transactionId)).toBeUndefined();

      const ledgerB = createHouseholdLedgerRepository({ householdId: householdB });
      const rowsB = await ledgerB.listTransactionsInRange(db, {
        days: SEPTEMBER,
        accountId: null,
      });
      expect(rowsB.find((row) => row.id === transactionId)?.manual).toBeNull();
    });
  });
});
