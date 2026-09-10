import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

const currentHeaders = vi.hoisted(() => ({ value: new Headers() }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(currentHeaders.value),
}));

import { withTestDb } from "@/db/test/harness";
import { member } from "@/db/schema/auth.ts";
import { householdSettings } from "@/db/schema/households.ts";
import { getAuth, getCurrentSession, type CurrentSession } from "@/modules/auth";
import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";

import { createHousehold, listHouseholds, switchHousehold } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
  currentHeaders.value = new Headers();
});

async function activeHouseholdId(headers: Headers): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers });
  return session?.session.activeOrganizationId ?? null;
}

// Mirrors createHouseholdAction: resolve the CurrentSession (membership
// re-validated, not the raw activeOrganizationId hint) through the same
// headers before calling createHousehold, rather than a bare Headers.
async function sessionFor(headers: Headers): Promise<CurrentSession | null> {
  currentHeaders.value = headers;
  return getCurrentSession();
}

// Simulates the membership households.acceptInvitation (membership.ts) creates:
// a second household for a user who already has one active, without going
// through households.createHousehold's idempotency guard.
async function addHouseholdMembership(headers: Headers, name: string): Promise<string> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) {
    throw new Error("addHouseholdMembership requires a signed-in session");
  }
  const organization = await getAuth().api.createOrganization({
    body: {
      name,
      slug: crypto.randomUUID(),
      userId: session.user.id,
      keepCurrentActiveOrganization: true,
    },
  });
  return organization.id;
}

describe("createHousehold (integration)", () => {
  it("creates the household with its creator as the single owner, active on the session", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Ada",
        email: "ada@example.com",
        password: "correct-horse",
      });

      const outcome = await createHousehold(
        { name: "Casa da Ada", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(headers),
        db,
        headers,
      );

      expect(outcome.status).toBe("ok");
      if (outcome.status !== "ok") return;

      const members = await db
        .select()
        .from(member)
        .where(eq(member.organizationId, outcome.householdId));
      expect(members).toHaveLength(1);
      expect(members[0]?.role).toBe("owner");

      expect(await activeHouseholdId(headers)).toBe(outcome.householdId);
    });
  });

  it("persists the household's time zone and reserve multiple", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Beto",
        email: "beto@example.com",
        password: "correct-horse",
      });

      const outcome = await createHousehold(
        { name: "Casa do Beto", timeZone: "America/Recife", reserveMultiple: 9 },
        await sessionFor(headers),
        db,
        headers,
      );
      expect(outcome.status).toBe("ok");
      if (outcome.status !== "ok") return;

      const [row] = await db
        .select()
        .from(householdSettings)
        .where(eq(householdSettings.householdId, outcome.householdId));
      expect(row).toMatchObject({ timeZone: "America/Recife", reserveMultiple: 9 });
    });
  });

  it("refuses to create a household for a signed-out request", async () => {
    await withTestDb(async (db) => {
      const outcome = await createHousehold(
        { name: "No session", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        null,
        db,
        new Headers(),
      );
      expect(outcome.status).toBe("unauthenticated");
    });
  });

  it("refuses to create a second household when the session already has an active one", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Helo",
        email: "helo@example.com",
        password: "correct-horse",
      });

      const first = await createHousehold(
        { name: "Casa da Helo", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(headers),
        db,
        headers,
      );
      expect(first.status).toBe("ok");

      const second = await createHousehold(
        { name: "Segunda casa da Helo", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(headers),
        db,
        headers,
      );
      expect(second.status).toBe("already_has_household");
    });
  });
});

describe("listHouseholds and switchHousehold (integration)", () => {
  it("lists only the households the signed-in user belongs to", async () => {
    await withTestDb(async (db) => {
      const carlaHeaders = await signUpVerifiedUser(db, {
        name: "Carla",
        email: "carla@example.com",
        password: "correct-horse",
      });
      const davidHeaders = await signUpVerifiedUser(db, {
        name: "David",
        email: "david@example.com",
        password: "correct-horse",
      });

      await createHousehold(
        { name: "Casa da Carla", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(carlaHeaders),
        db,
        carlaHeaders,
      );
      await createHousehold(
        { name: "Casa do David", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(davidHeaders),
        db,
        davidHeaders,
      );

      const carlaHouseholds = await listHouseholds(carlaHeaders);
      expect(carlaHouseholds).toHaveLength(1);
      expect(carlaHouseholds[0]?.name).toBe("Casa da Carla");
    });
  });

  it("switches the active household among the ones the user belongs to", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Elis",
        email: "elis@example.com",
        password: "correct-horse",
      });

      const first = await createHousehold(
        { name: "Casa 1", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(headers),
        db,
        headers,
      );
      if (first.status !== "ok") {
        throw new Error("household creation failed in test setup");
      }
      const secondHouseholdId = await addHouseholdMembership(headers, "Casa 2");

      expect(await activeHouseholdId(headers)).toBe(first.householdId);

      const switchOutcome = await switchHousehold(secondHouseholdId, headers);
      expect(switchOutcome.status).toBe("ok");
      expect(await activeHouseholdId(headers)).toBe(secondHouseholdId);

      const switchBackOutcome = await switchHousehold(first.householdId, headers);
      expect(switchBackOutcome.status).toBe("ok");
      expect(await activeHouseholdId(headers)).toBe(first.householdId);
    });
  });

  it("refuses to switch into a household the user is not a member of, leaving the previous one active", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpVerifiedUser(db, {
        name: "Fabio",
        email: "fabio@example.com",
        password: "correct-horse",
      });
      const outsiderHeaders = await signUpVerifiedUser(db, {
        name: "Gilda",
        email: "gilda@example.com",
        password: "correct-horse",
      });

      const outcome = await createHousehold(
        { name: "Casa do Fabio", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(ownerHeaders),
        db,
        ownerHeaders,
      );
      if (outcome.status !== "ok") {
        throw new Error("household creation failed in test setup");
      }
      const outsiderHousehold = await createHousehold(
        { name: "Casa da Gilda", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await sessionFor(outsiderHeaders),
        db,
        outsiderHeaders,
      );
      if (outsiderHousehold.status !== "ok") {
        throw new Error("household creation failed in test setup");
      }

      const switchOutcome = await switchHousehold(outcome.householdId, outsiderHeaders);
      expect(switchOutcome.status).toBe("not_a_member");
      expect(await activeHouseholdId(outsiderHeaders)).toBe(outsiderHousehold.householdId);
    });
  });
});
