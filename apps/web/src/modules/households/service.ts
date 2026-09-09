import { APIError } from "better-auth/api";

import { getAuth } from "@/modules/auth";

import type { Database } from "@/db/client";
import { createHouseholdSettingsRepository } from "./repository";
import { householdScope } from "./scope";
import type { CreateHouseholdFormInput } from "./validation";

export type CreateHouseholdOutcome =
  { status: "ok"; householdId: string } | { status: "unauthenticated" } | { status: "failed" };

function randomHouseholdSlug(): string {
  return crypto.randomUUID();
}

export async function createHousehold(
  input: CreateHouseholdFormInput,
  db: Database,
  requestHeaders: Headers,
): Promise<CreateHouseholdOutcome> {
  let createdOrganization: { id: string };
  try {
    createdOrganization = await getAuth().api.createOrganization({
      headers: requestHeaders,
      body: { name: input.name, slug: randomHouseholdSlug() },
    });
  } catch (error) {
    if (error instanceof APIError && error.status === "UNAUTHORIZED") {
      return { status: "unauthenticated" };
    }
    return { status: "failed" };
  }

  const householdId = createdOrganization.id;
  try {
    await createHouseholdSettingsRepository(householdScope({ householdId })).create(db, {
      timeZone: input.timeZone,
      reserveMultiple: input.reserveMultiple,
    });
  } catch {
    await getAuth()
      .api.deleteOrganization({ headers: requestHeaders, body: { organizationId: householdId } })
      .catch(() => undefined);
    return { status: "failed" };
  }

  return { status: "ok", householdId };
}

export type HouseholdSummary = { id: string; name: string };

export async function listHouseholds(requestHeaders: Headers): Promise<HouseholdSummary[]> {
  const organizations = await getAuth().api.listOrganizations({ headers: requestHeaders });
  return organizations.map((org) => ({ id: org.id, name: org.name }));
}

export type SwitchHouseholdOutcome =
  { status: "ok" } | { status: "not_a_member" } | { status: "failed" };

export async function switchHousehold(
  householdId: string,
  requestHeaders: Headers,
): Promise<SwitchHouseholdOutcome> {
  try {
    await getAuth().api.setActiveOrganization({
      headers: requestHeaders,
      body: { organizationId: householdId },
    });
    return { status: "ok" };
  } catch (error) {
    if (error instanceof APIError && error.status === "FORBIDDEN") {
      return { status: "not_a_member" };
    }
    return { status: "failed" };
  }
}
