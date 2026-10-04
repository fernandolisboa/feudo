import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { user } from "@/modules/auth/schema";
import { joinHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";

import { createFinancialDataAccessRepository } from "./repository";
import { financialDataAccess } from "./schema";

import type { FinancialDataAccessScope } from "./scope";
import type { Database } from "@/platform/db/client";

async function addMember(db: Database, householdId: string, name: string): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(user).values({
    id,
    name,
    email: `${id}@example.com`,
    emailVerified: true,
    termsVersion: "test",
    termsAcceptedAt: new Date(),
  });
  await joinHousehold(db, id, householdId, "member");
  return id;
}

describe("financial data access repository isolation (integration)", () => {
  it("never lists household B's entries for a session scoped to household A", async () => {
    await withTwoUsers(async ({ db, userA, userB }) => {
      const scopeA: FinancialDataAccessScope = {
        householdId: userA.session.householdId,
        userId: userA.id,
      };
      const scopeB: FinancialDataAccessScope = {
        householdId: userB.session.householdId,
        userId: userB.id,
      };
      await createFinancialDataAccessRepository(scopeA).record(db, "overview");
      await createFinancialDataAccessRepository(scopeB).record(db, "reserve");

      const entriesA = await createFinancialDataAccessRepository(scopeA).listRecentForUser(db);
      const entriesB = await createFinancialDataAccessRepository(scopeB).listRecentForUser(db);

      expect(entriesA.map((entry) => entry.kind)).toEqual(["overview"]);
      expect(entriesB.map((entry) => entry.kind)).toEqual(["reserve"]);
    });
  });

  it("does not show one member's access to another member of the same household", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const partnerId = await addMember(db, householdA, "Partner");
      const ownerScope: FinancialDataAccessScope = { householdId: householdA, userId: userA.id };
      const partnerScope: FinancialDataAccessScope = { householdId: householdA, userId: partnerId };

      await createFinancialDataAccessRepository(ownerScope).record(db, "overview");
      await createFinancialDataAccessRepository(partnerScope).record(db, "transactions");

      const ownerEntries =
        await createFinancialDataAccessRepository(ownerScope).listRecentForUser(db);
      const partnerEntries =
        await createFinancialDataAccessRepository(partnerScope).listRecentForUser(db);

      expect(ownerEntries.map((entry) => entry.kind)).toEqual(["overview"]);
      expect(partnerEntries.map((entry) => entry.kind)).toEqual(["transactions"]);
    });
  });

  it("orders a user's own entries most-recent-first and respects the limit", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scopeA: FinancialDataAccessScope = {
        householdId: userA.session.householdId,
        userId: userA.id,
      };
      const repository = createFinancialDataAccessRepository(scopeA);
      await repository.record(db, "overview");
      await repository.record(db, "transactions");
      await repository.record(db, "reserve");

      const limited = await repository.listRecentForUser(db, 2);

      expect(limited).toHaveLength(2);
      expect(limited[0]?.kind).toBe("reserve");
      expect(limited[1]?.kind).toBe("transactions");
    });
  });
});

describe("financial data access survives the user who made it (integration, #27)", () => {
  it("keeps the household's rows, with user_id cleared, after the user is deleted, and shows them to nobody", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const scope: FinancialDataAccessScope = { householdId: householdA, userId: userA.id };
      const repository = createFinancialDataAccessRepository(scope);
      await repository.record(db, "overview");
      await repository.record(db, "reserve");

      await db.delete(user).where(eq(user.id, userA.id));

      const householdRows = await db
        .select({
          userId: financialDataAccess.userId,
          householdId: financialDataAccess.householdId,
        })
        .from(financialDataAccess)
        .where(eq(financialDataAccess.householdId, householdA));
      expect(householdRows).toHaveLength(2);
      expect(householdRows.every((row) => row.userId === null)).toBe(true);

      expect(await repository.listRecentForUser(db)).toEqual([]);
    });
  });
});

describe("collapsing a repeated read into one access (integration, #28)", () => {
  const WINDOW_SECONDS = 60;

  it("records the same person's same kind of read once within the window", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createFinancialDataAccessRepository({
        householdId: userA.session.householdId,
        userId: userA.id,
      });

      await repository.recordUnlessRecent(db, "transactions", WINDOW_SECONDS);
      await repository.recordUnlessRecent(db, "transactions", WINDOW_SECONDS);

      expect(await repository.listRecentForUser(db)).toHaveLength(1);
    });
  });

  it("records one access when the same reads arrive at the same time (RSC render and copy fetch)", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createFinancialDataAccessRepository({
        householdId: userA.session.householdId,
        userId: userA.id,
      });

      await Promise.all(
        Array.from({ length: 5 }, () =>
          repository.recordUnlessRecent(db, "transactions", WINDOW_SECONDS),
        ),
      );

      expect(await repository.listRecentForUser(db)).toHaveLength(1);
    });
  });

  it("records again once the previous read is older than the window", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const repository = createFinancialDataAccessRepository({
        householdId: userA.session.householdId,
        userId: userA.id,
      });

      await repository.recordUnlessRecent(db, "overview", WINDOW_SECONDS);
      await db
        .update(financialDataAccess)
        .set({ accessedAt: sql`now() - interval '61 seconds'` })
        .where(eq(financialDataAccess.userId, userA.id));
      await repository.recordUnlessRecent(db, "overview", WINDOW_SECONDS);

      expect(await repository.listRecentForUser(db)).toHaveLength(2);
    });
  });

  it("never collapses another kind, another member or another household's read", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA }) => {
      const partnerId = await addMember(db, householdA, "Partner");
      const ownerA = createFinancialDataAccessRepository({
        householdId: householdA,
        userId: userA.id,
      });
      const partner = createFinancialDataAccessRepository({
        householdId: householdA,
        userId: partnerId,
      });
      const ownerB = createFinancialDataAccessRepository({
        householdId: userB.session.householdId,
        userId: userB.id,
      });

      await ownerA.recordUnlessRecent(db, "overview", WINDOW_SECONDS);
      await ownerA.recordUnlessRecent(db, "reserve", WINDOW_SECONDS);
      await partner.recordUnlessRecent(db, "overview", WINDOW_SECONDS);
      await ownerB.recordUnlessRecent(db, "overview", WINDOW_SECONDS);

      expect((await ownerA.listRecentForUser(db)).map((entry) => entry.kind).sort()).toEqual([
        "overview",
        "reserve",
      ]);
      expect((await partner.listRecentForUser(db)).map((entry) => entry.kind)).toEqual([
        "overview",
      ]);
      expect((await ownerB.listRecentForUser(db)).map((entry) => entry.kind)).toEqual(["overview"]);
    });
  });
});
