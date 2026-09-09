import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import { withTestDb } from "@/db/test/harness";
import { member } from "@/db/schema/auth.ts";
import { householdSettings } from "@/db/schema/households.ts";
import { findLastFakeSentEmail, getAuth, signUp } from "@/modules/auth";

import { createHousehold, listHouseholds, switchHousehold } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
});

async function signUpAndSignIn(
  db: Database,
  input: { name: string; email: string; password: string },
): Promise<Headers> {
  const outcome = await signUp({ ...input, termsAccepted: true }, new Headers());
  if (outcome.status !== "ok") {
    throw new Error(`sign-up failed: ${outcome.status}`);
  }

  const sentEmail = await findLastFakeSentEmail(db, input.email);
  if (!sentEmail) {
    throw new Error("no verification email was sent");
  }
  const link = /https?:\/\/\S+/.exec(sentEmail.text)?.[0];
  if (!link) {
    throw new Error("verification email had no link");
  }
  const token = new URL(link).searchParams.get("token");
  if (!token) {
    throw new Error("verification link had no token");
  }
  await getAuth().api.verifyEmail({ query: { token } });

  const response = await getAuth().api.signInEmail({
    body: { email: input.email, password: input.password },
    asResponse: true,
  });
  const cookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}

async function activeHouseholdId(headers: Headers): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers });
  return session?.session.activeOrganizationId ?? null;
}

describe("createHousehold (integration)", () => {
  it("creates the household with its creator as the single owner, active on the session", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpAndSignIn(db, {
        name: "Ada",
        email: "ada@example.com",
        password: "correct-horse",
      });

      const outcome = await createHousehold(
        { name: "Casa da Ada", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
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
      const headers = await signUpAndSignIn(db, {
        name: "Beto",
        email: "beto@example.com",
        password: "correct-horse",
      });

      const outcome = await createHousehold(
        { name: "Casa do Beto", timeZone: "America/Recife", reserveMultiple: 9 },
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
        db,
        new Headers(),
      );
      expect(outcome.status).toBe("unauthenticated");
    });
  });
});

describe("listHouseholds and switchHousehold (integration)", () => {
  it("lists only the households the signed-in user belongs to", async () => {
    await withTestDb(async (db) => {
      const carlaHeaders = await signUpAndSignIn(db, {
        name: "Carla",
        email: "carla@example.com",
        password: "correct-horse",
      });
      const davidHeaders = await signUpAndSignIn(db, {
        name: "David",
        email: "david@example.com",
        password: "correct-horse",
      });

      await createHousehold(
        { name: "Casa da Carla", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        db,
        carlaHeaders,
      );
      await createHousehold(
        { name: "Casa do David", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
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
      const headers = await signUpAndSignIn(db, {
        name: "Elis",
        email: "elis@example.com",
        password: "correct-horse",
      });

      const first = await createHousehold(
        { name: "Casa 1", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        db,
        headers,
      );
      const second = await createHousehold(
        { name: "Casa 2", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        db,
        headers,
      );
      if (first.status !== "ok" || second.status !== "ok") {
        throw new Error("household creation failed in test setup");
      }

      expect(await activeHouseholdId(headers)).toBe(second.householdId);

      const switchOutcome = await switchHousehold(first.householdId, headers);
      expect(switchOutcome.status).toBe("ok");
      expect(await activeHouseholdId(headers)).toBe(first.householdId);
    });
  });

  it("refuses to switch into a household the user is not a member of", async () => {
    await withTestDb(async (db) => {
      const ownerHeaders = await signUpAndSignIn(db, {
        name: "Fabio",
        email: "fabio@example.com",
        password: "correct-horse",
      });
      const outsiderHeaders = await signUpAndSignIn(db, {
        name: "Gilda",
        email: "gilda@example.com",
        password: "correct-horse",
      });

      const outcome = await createHousehold(
        { name: "Casa do Fabio", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        db,
        ownerHeaders,
      );
      if (outcome.status !== "ok") {
        throw new Error("household creation failed in test setup");
      }

      const switchOutcome = await switchHousehold(outcome.householdId, outsiderHeaders);
      expect(switchOutcome.status).toBe("not_a_member");
    });
  });
});
