import { organization, user } from "@/modules/auth/schema";
import { withTestDb } from "@/platform/db/test/harness";

import type { Database } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { scopeForUser, type UserScope } from "../scope";

export type SeededUser = { id: string; scope: UserScope; session: HouseholdSession };

export type TwoUsers = {
  db: Database;
  userA: SeededUser;
  userB: SeededUser;
  householdA: string;
  householdB: string;
};

async function seedHousehold(db: Database, name: string): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(organization).values({ id, name, slug: id, createdAt: new Date() });
  return id;
}

async function seedUser(db: Database, name: string, householdId: string): Promise<SeededUser> {
  const id = crypto.randomUUID();
  await db.insert(user).values({
    id,
    name,
    email: `${id}@example.com`,
    emailVerified: true,
    termsVersion: "test",
    termsAcceptedAt: new Date(),
  });
  return {
    id,
    scope: scopeForUser(id),
    session: { userId: id, name, email: `${id}@example.com`, householdId, theme: "caderno" },
  };
}

// Isolation-test helper for the user-scoped and household-scoped tables of
// this slice (ADR-0001): two users, each in their own household, so a test
// can prove a scope built from A never reads or writes B's rows.
export async function withTwoUsers(run: (users: TwoUsers) => Promise<void>): Promise<void> {
  await withTestDb(async (db) => {
    const householdA = await seedHousehold(db, "Household A");
    const householdB = await seedHousehold(db, "Household B");
    const userA = await seedUser(db, "Ana", householdA);
    const userB = await seedUser(db, "Bia", householdB);
    await run({ db, userA, userB, householdA, householdB });
  });
}
