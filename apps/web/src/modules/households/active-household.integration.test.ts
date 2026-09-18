import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

const currentHeaders = vi.hoisted(() => ({ value: new Headers() }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(currentHeaders.value),
}));

import { withTestDb } from "@/platform/db/test/harness";
import { session as sessionTable } from "@/modules/auth/schema.ts";
import { getAuth, getCurrentSession } from "@/modules/auth";
import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";

import { getHouseholdSettings } from "./repository";
import { householdScope, NoActiveHouseholdError } from "./scope";
import { createHousehold } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
  currentHeaders.value = new Headers();
});

async function signInAgain(email: string, password: string): Promise<Headers> {
  const response = await getAuth().api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  const cookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}

// Mirrors createHouseholdAction: resolve the CurrentSession (membership
// re-validated, not the raw activeOrganizationId hint) through the same
// headers before calling createHousehold.
async function sessionFor(headers: Headers) {
  currentHeaders.value = headers;
  return getCurrentSession();
}

describe("getCurrentSession active-household resolution (integration)", () => {
  it("resolves a returning user's existing household on a fresh sign-in", async () => {
    await withTestDb(async (db) => {
      const email = "returning@example.com";
      const password = "correct-horse";
      const firstSessionHeaders = await signUpVerifiedUser(db, {
        name: "Returning User",
        email,
        password,
      });

      const created = await createHousehold(
        { name: "Casa", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(firstSessionHeaders),
        db,
        firstSessionHeaders,
      );
      expect(created.status).toBe("ok");
      if (created.status !== "ok") return;

      const secondSessionHeaders = await signInAgain(email, password);
      currentHeaders.value = secondSessionHeaders;

      const session = await getCurrentSession();
      expect(session?.householdId).toBe(created.householdId);
    });
  });

  it("refuses a second household on a fresh sign-in whose raw activeOrganizationId hint is still empty", async () => {
    await withTestDb(async (db) => {
      const email = "returning-fresh@example.com";
      const password = "correct-horse";
      const firstSessionHeaders = await signUpVerifiedUser(db, {
        name: "Returning Fresh",
        email,
        password,
      });

      const created = await createHousehold(
        { name: "Casa", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(firstSessionHeaders),
        db,
        firstSessionHeaders,
      );
      expect(created.status).toBe("ok");

      const secondSessionHeaders = await signInAgain(email, password);
      const session = await sessionFor(secondSessionHeaders);

      const rawSession = await getAuth().api.getSession({ headers: secondSessionHeaders });
      if (!rawSession) throw new Error("second sign-in failed in test setup");
      await db
        .update(sessionTable)
        .set({ activeOrganizationId: null })
        .where(eq(sessionTable.id, rawSession.session.id));
      const [sessionRow] = await db
        .select({ activeOrganizationId: sessionTable.activeOrganizationId })
        .from(sessionTable)
        .where(eq(sessionTable.id, rawSession.session.id));
      expect(sessionRow?.activeOrganizationId).toBeNull();

      // With the raw hint forced back to null, only a guard reading the
      // membership-resolved CurrentSession.householdId (captured in
      // `session` above, before this reset) still refuses; a guard reading
      // session.activeOrganizationId straight off the row would see null
      // here and let a second household through.
      const secondAttempt = await createHousehold(
        { name: "Segunda casa", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        session,
        db,
        secondSessionHeaders,
      );
      expect(secondAttempt.status).toBe("already_has_household");
    });
  });
});

describe("removing a member invalidates their stale active household (integration)", () => {
  it("clears a removed member's session and stops it from resolving to that household", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Owner",
        email: "owner@example.com",
        password: "correct-horse",
      });
      const created = await createHousehold(
        { name: "Casa", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(ownerHeaders),
        db,
        ownerHeaders,
      );
      expect(created.status).toBe("ok");
      if (created.status !== "ok") return;
      const householdId = created.householdId;

      const memberHeaders = await signUpVerifiedUser(db, {
        name: "Member",
        email: "member@example.com",
        password: "correct-horse",
      });
      const memberSession = await getAuth().api.getSession({ headers: memberHeaders });
      if (!memberSession) throw new Error("member sign-in failed in test setup");

      await getAuth().api.addMember({
        body: { userId: memberSession.user.id, organizationId: householdId, role: "member" },
      });

      currentHeaders.value = memberHeaders;
      const beforeRemoval = await getCurrentSession();
      expect(beforeRemoval?.householdId).toBe(householdId);

      await getAuth().api.removeMember({
        headers: ownerHeaders,
        body: { memberIdOrEmail: "member@example.com", organizationId: householdId },
      });

      const [sessionRow] = await db
        .select({ activeOrganizationId: sessionTable.activeOrganizationId })
        .from(sessionTable)
        .where(eq(sessionTable.id, memberSession.session.id));
      expect(sessionRow?.activeOrganizationId).toBeNull();

      currentHeaders.value = memberHeaders;
      const afterRemoval = await getCurrentSession();
      expect(afterRemoval?.householdId).toBeNull();

      // No scope can be built for the household the member was removed from
      // anymore, so no household-scoped repository call — including reading
      // household_settings — can reach it through this session either.
      expect(afterRemoval).not.toBeNull();
      if (!afterRemoval) return;
      expect(() => householdScope(afterRemoval)).toThrow(NoActiveHouseholdError);

      currentHeaders.value = ownerHeaders;
      const ownerSession = await getCurrentSession();
      expect(ownerSession).not.toBeNull();
      if (!ownerSession) return;
      const ownerReadableSettings = await getHouseholdSettings(householdScope(ownerSession), db);
      expect(ownerReadableSettings).toMatchObject({ timeZone: "America/Sao_Paulo" });
    });
  });
});
