import { describe, expect, it } from "vitest";

import { member, organization, user } from "@/modules/auth/schema";
import { withTestDb } from "@/platform/db/test/harness";

import { lockMembershipScope } from "./membership-scope";

import type { Database } from "@/platform/db/client";

async function seedHousehold(db: Database): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(organization).values({ id, name: id, slug: id, createdAt: new Date() });
  return id;
}

async function seedMember(db: Database, householdId: string): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(user).values({
    id,
    name: "Ana",
    email: `${id}@example.com`,
    emailVerified: true,
    termsVersion: "test",
    termsAcceptedAt: new Date(),
  });
  await db.insert(member).values({
    id: crypto.randomUUID(),
    organizationId: householdId,
    userId: id,
    role: "owner",
    createdAt: new Date(),
  });
  return id;
}

describe("lockMembershipScope (integration)", () => {
  it("builds a scope only for a household the user belongs to", async () => {
    await withTestDb(async (db) => {
      const householdA = await seedHousehold(db);
      const householdB = await seedHousehold(db);
      const userA = await seedMember(db, householdA);
      await seedMember(db, householdB);

      expect(await lockMembershipScope(db, userA, householdA)).toEqual({ householdId: householdA });
      expect(await lockMembershipScope(db, userA, householdB)).toBeNull();
      expect(await lockMembershipScope(db, userA, "no-such-household")).toBeNull();
    });
  });
});
