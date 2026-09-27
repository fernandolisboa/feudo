import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { householdScope } from "@/modules/households";
import { bankTransaction } from "@/modules/sync/schema";
import { seedSyncedConnection, seedTransaction } from "@/modules/sync/test/seed-synced-connection";
import { withTwoUsers } from "@/modules/sync/test/with-two-users";

import {
  addSubcategory,
  categorizeTransaction,
  changeSubcategoryKind,
  removeRule,
  resetTransactionCategory,
} from "./categorization-service";
import { createCategorizationRepository } from "./categorization-repository";

import type { Database } from "@/platform/db/client";

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

describe("categorizeTransaction (integration)", () => {
  it("sets the manual choice and saves the rule together when createRule is on", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [
          seedTransaction({ providerTransactionId: "a-1", description: "PIX ENVIADO CONDOMINIO" }),
        ],
      });
      const transactionId = await transactionIdFor(db, "a-1");

      const outcome = await categorizeTransaction(
        {
          transactionId,
          subcategory: { type: "product", id: "housing.condo" },
          createRule: "on",
          pattern: "CONDOMINIO",
          direction: "debit",
        },
        userA.session,
        db,
      );
      expect(outcome).toEqual({ status: "ok" });

      const repository = createCategorizationRepository(householdScope(userA.session));
      const rules = await repository.listRules(db);
      expect(rules).toHaveLength(1);
      expect(rules[0]).toMatchObject({
        pattern: "CONDOMINIO",
        direction: "debit",
        subcategory: { type: "product", id: "housing.condo" },
      });
    });
  });

  it("does not write anything for another household's transaction", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [seedTransaction({ providerTransactionId: "a-2" })],
      });
      const transactionId = await transactionIdFor(db, "a-2");

      const outcome = await categorizeTransaction(
        {
          transactionId,
          subcategory: { type: "product", id: "housing.condo" },
          createRule: "off",
        },
        userB.session,
        db,
      );
      expect(outcome).toEqual({ status: "not_found" });

      const repositoryA = createCategorizationRepository(householdScope(userA.session));
      const repositoryB = createCategorizationRepository(householdScope(userB.session));
      expect(await repositoryA.listRules(db)).toEqual([]);
      expect(await repositoryB.listRules(db)).toEqual([]);
    });
  });

  it("returns not_found and writes nothing when the rule's target subcategory belongs to another household", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [seedTransaction({ providerTransactionId: "a-3" })],
      });
      const transactionId = await transactionIdFor(db, "a-3");
      const repositoryB = createCategorizationRepository(householdScope(userB.session));
      const created = await repositoryB.addHouseholdSubcategory(db, {
        categoryId: "shopping",
        name: "Presentes",
        kind: "variable",
      });
      if (created.status !== "ok") {
        throw new Error("setup failed");
      }

      const outcome = await categorizeTransaction(
        {
          transactionId,
          subcategory: { type: "household", id: created.id },
          createRule: "on",
          pattern: "PRESENTE",
          direction: null,
        },
        userA.session,
        db,
      );
      expect(outcome).toEqual({ status: "not_found" });

      const repositoryA = createCategorizationRepository(householdScope(userA.session));
      expect(await repositoryA.listRules(db)).toEqual([]);
      const rows = await db
        .select()
        .from(bankTransaction)
        .where(eq(bankTransaction.id, transactionId));
      expect(rows).toHaveLength(1);
    });
  });
});

describe("resetTransactionCategory (integration)", () => {
  it("clears a manual choice set through categorizeTransaction", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      await seedSyncedConnection(db, userA, {
        household: householdScope(userA.session),
        transactions: [seedTransaction({ providerTransactionId: "a-4" })],
      });
      const transactionId = await transactionIdFor(db, "a-4");
      await categorizeTransaction(
        { transactionId, subcategory: { type: "product", id: "housing.condo" }, createRule: "off" },
        userA.session,
        db,
      );

      expect(await resetTransactionCategory(transactionId, userA.session, db)).toEqual({
        status: "ok",
      });
      expect(await resetTransactionCategory(transactionId, userA.session, db)).toEqual({
        status: "not_found",
      });
    });
  });
});

describe("addSubcategory (integration)", () => {
  it("reports duplicate for a case-insensitive repeat within the same category", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const input = {
        categoryId: "shopping" as const,
        name: "Presentes",
        kind: "variable" as const,
      };
      expect(await addSubcategory(input, userA.session, db)).toEqual({ status: "ok" });
      expect(await addSubcategory({ ...input, name: "presentes" }, userA.session, db)).toEqual({
        status: "duplicate",
      });
    });
  });
});

describe("changeSubcategoryKind (integration)", () => {
  it("overrides a product subcategory's kind for the household", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const outcome = await changeSubcategoryKind(
        { subcategory: { type: "product", id: "leisure.travel" }, kind: "fixed" },
        userA.session,
        db,
      );
      expect(outcome).toEqual({ status: "ok" });

      const repository = createCategorizationRepository(householdScope(userA.session));
      expect(await repository.listKindOverrides(db)).toEqual(
        new Map([["leisure.travel", "fixed"]]),
      );
    });
  });
});

describe("removeRule (integration)", () => {
  it("returns not_found for another household's rule and leaves it in place", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const repositoryA = createCategorizationRepository(householdScope(userA.session));
      expect(
        await repositoryA.saveRule(
          db,
          {
            pattern: "CONDOMINIO",
            direction: "debit",
            subcategory: { type: "product", id: "housing.condo" },
          },
          userA.id,
        ),
      ).toBe("ok");
      const [rule] = await repositoryA.listRules(db);
      if (!rule) {
        throw new Error("setup failed");
      }

      expect(await removeRule(rule.id, userB.session, db)).toEqual({ status: "not_found" });
      expect(await repositoryA.listRules(db)).toHaveLength(1);

      expect(await removeRule(UNKNOWN_ID, userA.session, db)).toEqual({ status: "not_found" });
    });
  });
});
