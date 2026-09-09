import { describe, expect, it } from "vitest";

import { withTestDb } from "@/db/test/harness";
import { user } from "@/db/schema/auth.ts";
import { listTermsAcceptancesForUser, recordTermsAcceptance } from "./terms-repository";

async function insertTestUser(
  db: Parameters<typeof recordTermsAcceptance>[0],
  id: string,
  email: string,
): Promise<void> {
  await db.insert(user).values({ id, name: "Test user", email, emailVerified: true });
}

describe("terms acceptance repository", () => {
  it("records a terms acceptance for a user with its version", async () => {
    await withTestDb(async (db) => {
      await insertTestUser(db, "user-a", "a@example.com");

      await recordTermsAcceptance(db, "user-a", "2026-09-09");

      const rows = await listTermsAcceptancesForUser(db, "user-a");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ userId: "user-a", version: "2026-09-09" });
      expect(rows[0]?.acceptedAt).toBeInstanceOf(Date);
    });
  });

  it("does not return one user's terms acceptance when listing for another user", async () => {
    await withTestDb(async (db) => {
      await insertTestUser(db, "user-a", "a@example.com");
      await insertTestUser(db, "user-b", "b@example.com");

      await recordTermsAcceptance(db, "user-a", "2026-09-09");

      const rowsForA = await listTermsAcceptancesForUser(db, "user-a");
      const rowsForB = await listTermsAcceptancesForUser(db, "user-b");

      expect(rowsForA).toHaveLength(1);
      expect(rowsForB).toHaveLength(0);
    });
  });
});
