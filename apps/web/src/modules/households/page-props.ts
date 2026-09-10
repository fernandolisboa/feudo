import { headers } from "next/headers";

import { getDb } from "@/db/client";

import type { CurrentSession } from "@/modules/auth";
import {
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
  const canManage = viewerRole === "owner" || viewerRole === "admin";

  const invitations = canManage ? await listPendingInvitations(session, requestHeaders) : [];
  const settings = await getHouseholdSettings(householdScope(session), db);

  return {
    members,
    viewerRole,
    canManage,
    invitations,
    timeZone: settings?.timeZone ?? DEFAULT_TIME_ZONE,
  };
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
