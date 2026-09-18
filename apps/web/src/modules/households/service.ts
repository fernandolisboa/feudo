import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";

import { getAuth, type CurrentSession } from "@/modules/auth";
import { organization } from "../auth/schema";

import type { Outcome, SimpleOutcome } from "@/lib/outcome";
import type { Database } from "@/platform/db/client";
import { createHouseholdSettingsRepository } from "./repository";
import { scopeForNewHousehold } from "./scope";
import type { CreateHouseholdFormInput } from "./validation";

export type CreateHouseholdOutcome = Outcome<
  { householdId: string },
  "unauthenticated" | "already_has_household" | "failed"
>;

function randomHouseholdSlug(): string {
  return crypto.randomUUID();
}

async function deleteOrganization(householdId: string, requestHeaders: Headers): Promise<void> {
  await getAuth()
    .api.deleteOrganization({ headers: requestHeaders, body: { organizationId: householdId } })
    .catch(() => undefined);
}

// Better Auth creates the organization and its owner member row before
// running afterCreateOrganization (auth/options.ts); if that hook's
// household_settings insert throws, the call above rejects without ever
// returning an id, but the organization and membership already exist. The
// slug is generated locally and unique, so it is the only handle left to
// find and compensate for the orphan.
async function deleteOrphanedOrganizationBySlug(
  db: Database,
  slug: string,
  requestHeaders: Headers,
): Promise<void> {
  const rows = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);
  const orphanId = rows[0]?.id;
  if (orphanId) {
    await deleteOrganization(orphanId, requestHeaders);
  }
}

export async function createHousehold(
  input: CreateHouseholdFormInput,
  session: CurrentSession | null,
  db: Database,
  requestHeaders: Headers,
): Promise<CreateHouseholdOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }
  // householdId comes from getCurrentSession's membership-backed
  // resolution, not the raw session.activeOrganizationId: Better Auth
  // leaves that field empty on every fresh sign-in, so guarding on it
  // directly would let a returning owner create a second household.
  if (session.householdId) {
    return { status: "already_has_household" };
  }

  const slug = randomHouseholdSlug();
  let createdOrganization: { id: string };
  try {
    createdOrganization = await getAuth().api.createOrganization({
      headers: requestHeaders,
      body: {
        name: input.name,
        slug,
        // Deferred to setActiveOrganization below, after settings exist, so
        // a household is never active while its settings are still missing
        // or defaulted.
        keepCurrentActiveOrganization: true,
      },
    });
  } catch (error) {
    if (error instanceof APIError && error.status === "UNAUTHORIZED") {
      return { status: "unauthenticated" };
    }
    await deleteOrphanedOrganizationBySlug(db, slug, requestHeaders);
    return { status: "failed" };
  }

  const householdId = createdOrganization.id;
  try {
    // organizationHooks.afterCreateOrganization (auth/options.ts) already
    // inserted a default row for this household id; overwrite it with the
    // caller's chosen values.
    await createHouseholdSettingsRepository(scopeForNewHousehold(householdId)).update(db, {
      timeZone: input.timeZone,
      reserveMultiple: input.reserveMultiple,
    });
  } catch {
    await deleteOrganization(householdId, requestHeaders);
    return { status: "failed" };
  }

  try {
    await getAuth().api.setActiveOrganization({
      headers: requestHeaders,
      body: { organizationId: householdId },
    });
  } catch {
    await deleteOrganization(householdId, requestHeaders);
    return { status: "failed" };
  }

  return { status: "ok", householdId };
}

export type HouseholdSummary = { id: string; name: string };

export async function listHouseholds(requestHeaders: Headers): Promise<HouseholdSummary[]> {
  const organizations = await getAuth().api.listOrganizations({ headers: requestHeaders });
  return organizations.map((org) => ({ id: org.id, name: org.name }));
}

export type SwitchHouseholdOutcome = SimpleOutcome<"ok" | "not_a_member" | "failed">;

async function restorePreviousHousehold(
  previousHouseholdId: string | null,
  requestHeaders: Headers,
): Promise<void> {
  await getAuth()
    .api.setActiveOrganization({
      headers: requestHeaders,
      body: { organizationId: previousHouseholdId },
    })
    .catch(() => undefined);
}

export async function switchHousehold(
  householdId: string,
  requestHeaders: Headers,
): Promise<SwitchHouseholdOutcome> {
  const currentSession = await getAuth().api.getSession({ headers: requestHeaders });
  const previousHouseholdId = currentSession?.session.activeOrganizationId ?? null;

  try {
    await getAuth().api.setActiveOrganization({
      headers: requestHeaders,
      body: { organizationId: householdId },
    });
    return { status: "ok" };
  } catch (error) {
    // setActiveOrganization can leave the session's active household cleared
    // on a rejected switch rather than leaving the previous one in place;
    // restore it explicitly so a failed switch never silently signs the
    // household switcher out of the household it started in.
    await restorePreviousHousehold(previousHouseholdId, requestHeaders);
    if (error instanceof APIError && error.status === "FORBIDDEN") {
      return { status: "not_a_member" };
    }
    return { status: "failed" };
  }
}
