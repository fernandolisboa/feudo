import { APIError } from "better-auth/api";

import { getAuth } from "@/modules/auth";

import type { Outcome, SimpleOutcome } from "@/lib/outcome";
import type { Database } from "@/db/client";
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

export async function createHousehold(
  input: CreateHouseholdFormInput,
  db: Database,
  requestHeaders: Headers,
): Promise<CreateHouseholdOutcome> {
  const currentSession = await getAuth().api.getSession({ headers: requestHeaders });
  if (!currentSession) {
    return { status: "unauthenticated" };
  }
  if (currentSession.session.activeOrganizationId) {
    return { status: "already_has_household" };
  }

  let createdOrganization: { id: string };
  try {
    createdOrganization = await getAuth().api.createOrganization({
      headers: requestHeaders,
      body: {
        name: input.name,
        slug: randomHouseholdSlug(),
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
