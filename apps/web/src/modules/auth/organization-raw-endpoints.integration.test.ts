import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import type { Database } from "@/platform/db/client";
import { withTestDb } from "@/platform/db/test/harness";

import { getAuth } from "./auth";
import { INVITE_HOURLY_LIMIT } from "./invitations";
import {
  invitation,
  member,
  organization as organizationTable,
  session as sessionTable,
  user,
} from "./schema";
import { signUpVerifiedUser } from "./test/sign-up-verified-user";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

let requestCounter = 0;

// Each call gets its own client IP, so Better Auth's per-IP limiter never
// answers for the rule under test.
function rawPost(path: string, body: unknown, headers: Headers): Promise<Response> {
  requestCounter += 1;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("content-type", "application/json");
  requestHeaders.set(
    "x-forwarded-for",
    `10.1.${String(Math.floor(requestCounter / 250))}.${String(requestCounter % 250)}`,
  );
  return getAuth().handler(
    new Request(`http://localhost:3000/api/auth${path}`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
    }),
  );
}

async function createHouseholdFor(headers: Headers, name = "Casa"): Promise<string> {
  const created = await getAuth().api.createOrganization({
    headers,
    body: { name, slug: crypto.randomUUID() },
  });
  return created.id;
}

async function userIdOf(headers: Headers): Promise<string> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) throw new Error("sign-in failed in test setup");
  return session.user.id;
}

async function addMember(householdId: string, headers: Headers, role: "admin" | "member") {
  return getAuth().api.addMember({
    body: { userId: await userIdOf(headers), organizationId: householdId, role },
  });
}

async function seedRecentInvitations(
  db: Database,
  householdId: string,
  inviterId: string,
  total: number,
): Promise<void> {
  await db.insert(invitation).values(
    Array.from({ length: total }, (_, index) => ({
      id: crypto.randomUUID(),
      organizationId: householdId,
      email: `seeded-${String(index)}@example.com`,
      role: "member",
      status: "canceled",
      expiresAt: new Date(Date.now() + 60 * 60_000),
      createdAt: new Date(),
      inviterId,
    })),
  );
}

describe("raw /organization/* endpoints enforce the same rules as the server actions (integration)", () => {
  it("refuses a household name over 120 characters on create and on update", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Long Name",
        email: "long-name@example.com",
        password: "correct-horse",
      });

      const createResponse = await rawPost(
        "/organization/create",
        { name: "x".repeat(121), slug: crypto.randomUUID() },
        headers,
      );
      expect(createResponse.status).toBe(400);
      expect(await db.select().from(organizationTable)).toHaveLength(0);

      const householdId = await createHouseholdFor(headers);
      const updateResponse = await rawPost(
        "/organization/update",
        { organizationId: householdId, data: { name: `Casa\n${"x".repeat(200)}` } },
        headers,
      );
      expect(updateResponse.status).toBe(400);
      const [row] = await db
        .select({ name: organizationTable.name })
        .from(organizationTable)
        .where(eq(organizationTable.id, householdId));
      expect(row?.name).toBe("Casa");

      const okResponse = await rawPost(
        "/organization/update",
        { organizationId: householdId, data: { name: "x".repeat(120) } },
        headers,
      );
      expect(okResponse.status).toBe(200);
    });
  });

  it("refuses to create a household for someone who already belongs to one", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Has Household",
        email: "has-household@example.com",
        password: "correct-horse",
      });
      await createHouseholdFor(headers);

      const response = await rawPost(
        "/organization/create",
        { name: "Segunda casa", slug: crypto.randomUUID() },
        headers,
      );
      expect(response.status).toBe(403);
      expect(await db.select().from(organizationTable)).toHaveLength(1);
    });
  });

  it("lets someone whose only household is pending deletion start a new one", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Fresh Start",
        email: "fresh-start@example.com",
        password: "correct-horse",
      });
      const householdId = await createHouseholdFor(headers);
      await db
        .update(organizationTable)
        .set({ deletionRequestedAt: new Date() })
        .where(eq(organizationTable.id, householdId));
      // What getCurrentSession does on the next page load once the
      // household is hidden.
      await db
        .update(sessionTable)
        .set({ activeOrganizationId: null })
        .where(eq(sessionTable.userId, await userIdOf(headers)));

      const response = await rawPost(
        "/organization/create",
        { name: "Nova casa", slug: crypto.randomUUID() },
        headers,
      );
      expect(response.status).toBe(200);
    });
  });

  it("applies the per-inviter hourly invitation limit to raw invites and resends", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Inviter",
        email: "raw-inviter@example.com",
        password: "correct-horse",
      });
      const householdId = await createHouseholdFor(headers);
      const inviterId = await userIdOf(headers);

      const pending = await rawPost(
        "/organization/invite-member",
        { email: "pending-invitee@example.com", role: "member", organizationId: householdId },
        headers,
      );
      expect(pending.status).toBe(200);
      await seedRecentInvitations(db, householdId, inviterId, INVITE_HOURLY_LIMIT - 1);

      const fresh = await rawPost(
        "/organization/invite-member",
        { email: "one-too-many@example.com", role: "member", organizationId: householdId },
        headers,
      );
      expect(fresh.status).toBe(429);

      const resend = await rawPost(
        "/organization/invite-member",
        {
          email: "pending-invitee@example.com",
          role: "member",
          organizationId: householdId,
          resend: true,
        },
        headers,
      );
      expect(resend.status).toBe(429);

      const rows = await db
        .select({ email: invitation.email })
        .from(invitation)
        .where(eq(invitation.email, "one-too-many@example.com"));
      expect(rows).toHaveLength(0);
    });
  });

  it("refuses /organization/* over HTTP while the caller's accepted terms are outdated", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Outdated Terms",
        email: "outdated-terms@example.com",
        password: "correct-horse",
      });
      await db
        .update(user)
        .set({ termsVersion: "2000-01-01" })
        .where(eq(user.email, "outdated-terms@example.com"));

      const response = await rawPost(
        "/organization/create",
        { name: "Casa", slug: crypto.randomUUID() },
        headers,
      );
      expect(response.status).toBe(403);
      expect(await db.select().from(organizationTable)).toHaveLength(0);

      // Server-side calls carry no request: the pages' own redirect to the
      // acceptance page is their gate, so they are not refused here.
      await expect(createHouseholdFor(headers)).resolves.toEqual(expect.any(String));
    });
  });

  it.each([
    ["member,owner", "member"],
    [["member", "owner"], "member"],
    ["admin,member", "member"],
  ])(
    "refuses the multi-role update %j and leaves the member row as it was",
    async (role, before) => {
      await withTestDb(async (db) => {
        const ownerHeaders = await signUpVerifiedUser(db, {
          name: "Owner",
          email: "multi-role-owner@example.com",
          password: "correct-horse",
        });
        const householdId = await createHouseholdFor(ownerHeaders);
        const memberHeaders = await signUpVerifiedUser(db, {
          name: "Member",
          email: "multi-role-member@example.com",
          password: "correct-horse",
        });
        const added = await addMember(householdId, memberHeaders, "member");

        const response = await rawPost(
          "/organization/update-member-role",
          { memberId: added.id, role, organizationId: householdId },
          ownerHeaders,
        );
        expect([400, 403]).toContain(response.status);

        const [row] = await db
          .select({ role: member.role })
          .from(member)
          .where(eq(member.id, added.id));
        expect(row?.role).toBe(before);
      });
    },
  );

  it("still lets the owner make a member an admin and back", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "single-role-owner@example.com",
        password: "correct-horse",
      });
      const householdId = await createHouseholdFor(ownerHeaders);
      const memberHeaders = await signUpVerifiedUser(db, {
        name: "Member",
        email: "single-role-member@example.com",
        password: "correct-horse",
      });
      const added = await addMember(householdId, memberHeaders, "member");

      const promote = await rawPost(
        "/organization/update-member-role",
        { memberId: added.id, role: "admin", organizationId: householdId },
        ownerHeaders,
      );
      expect(promote.status).toBe(200);
      const demote = await rawPost(
        "/organization/update-member-role",
        { memberId: added.id, role: "member", organizationId: householdId },
        ownerHeaders,
      );
      expect(demote.status).toBe(200);
    });
  });
});
