import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { APIError } from "better-auth/api";

import { withTestDb } from "@/db/test/harness";
import { member } from "@/db/schema/auth.ts";
import { householdSettings } from "@/db/schema/households.ts";

import { getAuth } from "./auth";
import { signUpVerifiedUser } from "./test/sign-up-verified-user";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

describe("organization plugin hooks (integration)", () => {
  it("gives every organization a default household_settings row, even created outside households.createHousehold", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Direct Caller",
        email: "direct-caller@example.com",
        password: "correct-horse",
      });

      const organization = await getAuth().api.createOrganization({
        headers,
        body: { name: "Casa Direta", slug: crypto.randomUUID() },
      });

      const [row] = await db
        .select()
        .from(householdSettings)
        .where(eq(householdSettings.householdId, organization.id));
      expect(row).toMatchObject({ timeZone: "America/Sao_Paulo", reserveMultiple: 6 });
    });
  });

  it("refuses to create an organization with a logo or metadata", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Logo Caller",
        email: "logo-caller@example.com",
        password: "correct-horse",
      });

      await expect(
        getAuth().api.createOrganization({
          headers,
          body: { name: "Casa", slug: crypto.randomUUID(), logo: "https://example.com/x.png" },
        }),
      ).rejects.toThrow(APIError);
    });
  });

  it("refuses to promote a member to owner through the generic role-update endpoint", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "owner-role@example.com",
        password: "correct-horse",
      });
      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const memberHeaders = await signUpVerifiedUser(db, {
        name: "Member",
        email: "member-role@example.com",
        password: "correct-horse",
      });
      const memberSession = await getAuth().api.getSession({ headers: memberHeaders });
      if (!memberSession) throw new Error("member sign-in failed in test setup");

      const addedMember = await getAuth().api.addMember({
        body: { userId: memberSession.user.id, organizationId: organization.id, role: "member" },
      });

      await expect(
        getAuth().api.updateMemberRole({
          headers: ownerHeaders,
          body: { memberId: addedMember.id, role: "owner", organizationId: organization.id },
        }),
      ).rejects.toThrow(APIError);
    });
  });

  it("keeps at most one owner row per organization at the database level", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "owner-index@example.com",
        password: "correct-horse",
      });
      const organization = await getAuth().api.createOrganization({
        headers: ownerHeaders,
        body: { name: "Casa", slug: crypto.randomUUID() },
      });

      const secondUserHeaders = await signUpVerifiedUser(db, {
        name: "Second Owner Attempt",
        email: "second-owner@example.com",
        password: "correct-horse",
      });
      const secondUserSession = await getAuth().api.getSession({ headers: secondUserHeaders });
      if (!secondUserSession) throw new Error("second user sign-in failed in test setup");

      await expect(
        db.insert(member).values({
          id: crypto.randomUUID(),
          organizationId: organization.id,
          userId: secondUserSession.user.id,
          role: "owner",
          createdAt: new Date(),
        }),
      ).rejects.toThrow();
    });
  });
});
