import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { deletionPurgeAt } from "@feudo/core";

import { getDb, type Database } from "@/platform/db/client";

import type { CurrentSession } from "@/modules/auth";
import { organization } from "@/modules/auth/schema";
import { formatShortDate } from "@/lib/format-date";

import type { PendingHouseholdDeletionItem } from "./components/pending-household-deletions";
import { listOwnedHouseholdsPendingDeletion } from "./household-deletion";
import {
  canManageHouseholdSettings,
  listMembers,
  listMyPendingInvitations,
  listPendingInvitations,
  getInvitationPreview as getInvitationPreviewFromMembership,
  type HouseholdRole,
  type InvitationForUser,
  type InvitationPreviewOutcome,
  type HouseholdMember,
  type PendingInvitation,
} from "./membership";
import { getHouseholdSettings } from "./repository";
import type { HouseholdSession } from "./require-household-session";
import { householdScope } from "./scope";
import { DEFAULT_TIME_ZONE } from "./validation";

export type CasaPageProps = {
  members: HouseholdMember[];
  viewerRole: HouseholdRole;
  canManage: boolean;
  invitations: PendingInvitation[];
  timeZone: string;
  deletion: { householdName: string; restorableUntil: string } | null;
};

// Assembles everything /casa's page renders in one call, so the page itself
// stays a thin composition of households' own components and never reaches
// past the barrel into membership.ts, repository.ts or scope.ts directly.
export async function getCasaPageProps(session: HouseholdSession): Promise<CasaPageProps> {
  const requestHeaders = await headers();
  const db = getDb();

  const members = await listMembers(session, requestHeaders);
  const viewer = members.find((member) => member.userId === session.userId);
  const viewerRole = viewer?.role ?? "member";
  const canManage = canManageHouseholdSettings(viewerRole);

  const invitations = canManage ? await listPendingInvitations(session, db) : [];
  const settings = await getHouseholdSettings(householdScope(session), db);
  const timeZone = settings?.timeZone ?? DEFAULT_TIME_ZONE;

  return {
    members,
    viewerRole,
    canManage,
    invitations,
    timeZone,
    deletion:
      viewerRole === "owner"
        ? {
            householdName: await householdName(db, session.householdId),
            restorableUntil: formatShortDate(deletionPurgeAt(new Date()), timeZone),
          }
        : null,
  };
}

async function householdName(db: Database, householdId: string): Promise<string> {
  const [row] = await db
    .select({ name: organization.name })
    .from(organization)
    .where(eq(organization.id, householdId))
    .limit(1);
  return row?.name ?? "";
}

// Used by /preferencias and /comecar: the owner's only way back to a
// household they asked to delete.
export async function getPendingHouseholdDeletions(
  session: CurrentSession,
): Promise<PendingHouseholdDeletionItem[]> {
  const households = await listOwnedHouseholdsPendingDeletion(session, getDb());
  return households.map((household) => ({
    id: household.id,
    name: household.name,
    purgeDate: formatShortDate(household.purgeAt, household.timeZone),
  }));
}

// Used by onboarding's "Tenho um convite" tab.
export async function getOnboardingInvites(): Promise<InvitationForUser[]> {
  const requestHeaders = await headers();
  return listMyPendingInvitations(requestHeaders);
}

// Used by /convite/[id]: wraps membership.ts's getInvitationPreview with the
// headers and database connection a Server Component page never has to
// thread through itself.
export async function getInvitationPreview(
  invitationId: string,
  session: CurrentSession | null,
): Promise<InvitationPreviewOutcome> {
  const requestHeaders = await headers();
  const db = getDb();
  return getInvitationPreviewFromMembership(invitationId, session, db, requestHeaders);
}
