import { describe, expect, it } from "vitest";

import { user } from "@/modules/auth/schema";
import { householdScope, type HouseholdScope } from "@/modules/households";
import { joinHousehold, withTwoUsers } from "@/modules/sync/test/with-two-users";

import { createFinancialDataAccessRepository } from "./repository";

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
      const scopeA = householdScope(userA.session);
      const scopeB = householdScope(userB.session);
      await createFinancialDataAccessRepository(scopeA).record(db, userA.id, "overview");
      await createFinancialDataAccessRepository(scopeB).record(db, userB.id, "reserve");

      const entriesA = await createFinancialDataAccessRepository(scopeA).listRecentForUser(
        db,
        userA.id,
      );
      const entriesB = await createFinancialDataAccessRepository(scopeB).listRecentForUser(
        db,
        userB.id,
      );

      expect(entriesA.map((entry) => entry.kind)).toEqual(["overview"]);
      expect(entriesB.map((entry) => entry.kind)).toEqual(["reserve"]);
    });
  });

  it("does not show one member's access to another member of the same household", async () => {
    await withTwoUsers(async ({ db, userA, householdA }) => {
      const scopeA: HouseholdScope = { householdId: householdA };
      const partnerId = await addMember(db, householdA, "Partner");

      await createFinancialDataAccessRepository(scopeA).record(db, userA.id, "overview");
      await createFinancialDataAccessRepository(scopeA).record(db, partnerId, "transactions");

      const ownerEntries = await createFinancialDataAccessRepository(scopeA).listRecentForUser(
        db,
        userA.id,
      );
      const partnerEntries = await createFinancialDataAccessRepository(scopeA).listRecentForUser(
        db,
        partnerId,
      );

      expect(ownerEntries.map((entry) => entry.kind)).toEqual(["overview"]);
      expect(partnerEntries.map((entry) => entry.kind)).toEqual(["transactions"]);
    });
  });

  it("orders a user's own entries most-recent-first and respects the limit", async () => {
    await withTwoUsers(async ({ db, userA }) => {
      const scopeA = householdScope(userA.session);
      const repository = createFinancialDataAccessRepository(scopeA);
      await repository.record(db, userA.id, "overview");
      await repository.record(db, userA.id, "transactions");
      await repository.record(db, userA.id, "reserve");

      const limited = await repository.listRecentForUser(db, userA.id, 2);

      expect(limited).toHaveLength(2);
      expect(limited[0]?.kind).toBe("reserve");
      expect(limited[1]?.kind).toBe("transactions");
    });
  });
});
