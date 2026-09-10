import { APIError } from "better-auth/api";
import { and, count, eq } from "drizzle-orm";

import { getAuth, type CurrentSession } from "@/modules/auth";
import { member, session as sessionTable } from "@/db/schema";

import type { Outcome, SimpleOutcome } from "@/lib/outcome";
import type { Database } from "@/db/client";
import type { HouseholdSession } from "./require-household-session";
import type { InvitableRole, InviteMemberFormInput, UpdateMemberRoleFormInput } from "./validation";

function apiErrorCode(error: unknown): string | undefined {
  if (!(error instanceof APIError)) {
    return undefined;
  }
  const body = error.body as { code?: string } | undefined;
  return body?.code;
}

export type HouseholdRole = "owner" | InvitableRole;

export type HouseholdMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: HouseholdRole;
  joinedAt: Date;
};

export async function listMembers(
  session: HouseholdSession,
  requestHeaders: Headers,
): Promise<HouseholdMember[]> {
  const { members } = await getAuth().api.listMembers({
    headers: requestHeaders,
    query: { organizationId: session.householdId, limit: 200 },
  });
  return members.map((row) => ({
    id: row.id,
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    role: row.role,
    joinedAt: row.createdAt,
  }));
}

export type PendingInvitation = {
  id: string;
  email: string;
  role: InvitableRole;
  expiresAt: Date;
};

export async function listPendingInvitations(
  session: HouseholdSession,
  requestHeaders: Headers,
): Promise<PendingInvitation[]> {
  const invitations = await getAuth().api.listInvitations({
    headers: requestHeaders,
    query: { organizationId: session.householdId },
  });
  return invitations
    .filter((invitation) => invitation.status === "pending")
    .map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as InvitableRole,
      expiresAt: invitation.expiresAt,
    }));
}

export type InvitationForUser = {
  id: string;
  householdName: string;
  role: InvitableRole;
  expiresAt: Date;
};

// Used by onboarding's "Tenho um convite" path: lists every pending
// invitation for the signed-in user's own email, across every household —
// the user has no active household yet, so this cannot be scoped to one.
export async function listMyPendingInvitations(
  requestHeaders: Headers,
): Promise<InvitationForUser[]> {
  const invitations = await getAuth().api.listUserInvitations({ headers: requestHeaders });
  const now = new Date();
  return invitations
    .filter((invitation) => invitation.status === "pending" && invitation.expiresAt > now)
    .map((invitation) => ({
      id: invitation.id,
      householdName: invitation.organizationName,
      role: invitation.role as InvitableRole,
      expiresAt: invitation.expiresAt,
    }));
}

export type InviteMemberOutcome = Outcome<
  { invitationId: string },
  "unauthenticated" | "not_allowed" | "already_a_member" | "already_invited" | "failed"
>;

export async function inviteMember(
  input: InviteMemberFormInput,
  session: HouseholdSession | null,
  requestHeaders: Headers,
): Promise<InviteMemberOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }
  try {
    const invitation = await getAuth().api.createInvitation({
      headers: requestHeaders,
      body: { email: input.email, role: input.role, organizationId: session.householdId },
    });
    return { status: "ok", invitationId: invitation.id };
  } catch (error) {
    const code = apiErrorCode(error);
    if (code === "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION") {
      return { status: "already_a_member" };
    }
    if (code === "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION") {
      return { status: "already_invited" };
    }
    if (
      code === "YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION" ||
      code === "YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE"
    ) {
      return { status: "not_allowed" };
    }
    return { status: "failed" };
  }
}

export type CancelInvitationOutcome = SimpleOutcome<
  "ok" | "unauthenticated" | "not_allowed" | "not_found" | "failed"
>;

export async function cancelInvitation(
  invitationId: string,
  session: HouseholdSession | null,
  requestHeaders: Headers,
): Promise<CancelInvitationOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }
  try {
    await getAuth().api.cancelInvitation({ headers: requestHeaders, body: { invitationId } });
    return { status: "ok" };
  } catch (error) {
    const code = apiErrorCode(error);
    // MEMBER_NOT_FOUND here means the caller is not a member of the
    // invitation's own household (e.g. an id belonging to another
    // household) — folded into not_found so a cross-household guess never
    // learns whether the id exists.
    if (code === "INVITATION_NOT_FOUND" || code === "MEMBER_NOT_FOUND") {
      return { status: "not_found" };
    }
    if (code === "YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION") {
      return { status: "not_allowed" };
    }
    return { status: "failed" };
  }
}

export type AcceptInvitationOutcome = Outcome<
  { householdId: string },
  "unauthenticated" | "not_found" | "wrong_email" | "email_not_verified" | "failed"
>;

export async function acceptInvitation(
  invitationId: string,
  session: CurrentSession | null,
  requestHeaders: Headers,
): Promise<AcceptInvitationOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }
  try {
    const result = await getAuth().api.acceptInvitation({
      headers: requestHeaders,
      body: { invitationId },
    });
    return { status: "ok", householdId: result.invitation.organizationId };
  } catch (error) {
    const code = apiErrorCode(error);
    if (code === "INVITATION_NOT_FOUND") {
      return { status: "not_found" };
    }
    if (code === "YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION") {
      return { status: "wrong_email" };
    }
    if (code === "EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION") {
      return { status: "email_not_verified" };
    }
    return { status: "failed" };
  }
}

export type InvitationPreview = { householdName: string; role: InvitableRole };
export type InvitationPreviewOutcome = Outcome<
  InvitationPreview,
  "unauthenticated" | "not_found" | "wrong_email" | "failed"
>;

// Used by /convite/[id]: shows what a signed-in recipient is about to join
// before they confirm, without exposing anything to a stranger who guesses
// another recipient's invite id (getInvitation itself checks the session's
// email against the invitation's).
export async function getInvitationPreview(
  invitationId: string,
  session: CurrentSession | null,
  requestHeaders: Headers,
): Promise<InvitationPreviewOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }
  try {
    const invitation = await getAuth().api.getInvitation({
      headers: requestHeaders,
      query: { id: invitationId },
    });
    return {
      status: "ok",
      householdName: invitation.organizationName,
      role: invitation.role as InvitableRole,
    };
  } catch (error) {
    const code = apiErrorCode(error);
    if (code === "YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION") {
      return { status: "wrong_email" };
    }
    if (error instanceof APIError && error.status === "BAD_REQUEST") {
      return { status: "not_found" };
    }
    return { status: "failed" };
  }
}

export type RemoveMemberOutcome = SimpleOutcome<
  "ok" | "unauthenticated" | "cannot_remove_owner" | "not_allowed" | "not_found" | "failed"
>;

export async function removeMember(
  memberId: string,
  session: HouseholdSession | null,
  requestHeaders: Headers,
): Promise<RemoveMemberOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }
  try {
    await getAuth().api.removeMember({
      headers: requestHeaders,
      body: { memberIdOrEmail: memberId, organizationId: session.householdId },
    });
    return { status: "ok" };
  } catch (error) {
    const code = apiErrorCode(error);
    if (code === "YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER") {
      return { status: "cannot_remove_owner" };
    }
    if (code === "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER") {
      return { status: "not_allowed" };
    }
    if (code === "MEMBER_NOT_FOUND") {
      return { status: "not_found" };
    }
    return { status: "failed" };
  }
}

export type UpdateMemberRoleOutcome = SimpleOutcome<
  "ok" | "unauthenticated" | "not_allowed" | "not_found" | "failed"
>;

export async function updateMemberRole(
  input: UpdateMemberRoleFormInput,
  session: HouseholdSession | null,
  requestHeaders: Headers,
): Promise<UpdateMemberRoleOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }
  try {
    await getAuth().api.updateMemberRole({
      headers: requestHeaders,
      body: { memberId: input.memberId, role: input.role, organizationId: session.householdId },
    });
    return { status: "ok" };
  } catch (error) {
    const code = apiErrorCode(error);
    if (code === "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER") {
      return { status: "not_allowed" };
    }
    if (code === "MEMBER_NOT_FOUND") {
      return { status: "not_found" };
    }
    if (error instanceof APIError && error.message === "owner_role_not_transferable") {
      return { status: "not_allowed" };
    }
    return { status: "failed" };
  }
}

async function activeMemberRow(
  db: Database,
  householdId: string,
  userId: string,
): Promise<{ id: string; role: string } | undefined> {
  const rows = await db
    .select({ id: member.id, role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, householdId), eq(member.userId, userId)))
    .limit(1);
  return rows[0];
}

export type TransferOwnershipOutcome = SimpleOutcome<
  "ok" | "unauthenticated" | "not_allowed" | "member_not_found" | "already_owner" | "failed"
>;

// Ownership never moves through the generic role-update endpoint
// (organizationHooks.beforeUpdateMemberRole rejects any "owner" role
// unconditionally) — this promotes and demotes in one database transaction
// instead (ADR-0001), reading both member rows through Drizzle directly.
export async function transferOwnership(
  newOwnerMemberId: string,
  session: HouseholdSession | null,
  db: Database,
): Promise<TransferOwnershipOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }

  const currentOwner = await activeMemberRow(db, session.householdId, session.userId);
  if (!currentOwner || currentOwner.role !== "owner") {
    return { status: "not_allowed" };
  }
  if (currentOwner.id === newOwnerMemberId) {
    return { status: "already_owner" };
  }

  const targetRows = await db
    .select({ id: member.id, organizationId: member.organizationId })
    .from(member)
    .where(eq(member.id, newOwnerMemberId))
    .limit(1);
  const target = targetRows[0];
  if (!target || target.organizationId !== session.householdId) {
    return { status: "member_not_found" };
  }

  try {
    await db.transaction(async (tx) => {
      // Demote first: the partial unique index on member (organization_id)
      // where role = 'owner' rejects a moment with two owner rows, but a
      // moment with zero is never checked, so this order never trips it.
      await tx.update(member).set({ role: "admin" }).where(eq(member.id, currentOwner.id));
      await tx.update(member).set({ role: "owner" }).where(eq(member.id, target.id));
    });
  } catch {
    return { status: "failed" };
  }

  return { status: "ok" };
}

export type LeaveHouseholdOutcome = Outcome<
  { householdDeleted: boolean },
  "unauthenticated" | "owner_must_transfer_first" | "failed"
>;

export async function leaveHousehold(
  session: HouseholdSession | null,
  db: Database,
  requestHeaders: Headers,
): Promise<LeaveHouseholdOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }

  const requester = await activeMemberRow(db, session.householdId, session.userId);
  if (!requester) {
    return { status: "failed" };
  }

  if (requester.role === "owner") {
    const [row] = await db
      .select({ total: count() })
      .from(member)
      .where(eq(member.organizationId, session.householdId));
    if ((row?.total ?? 0) > 1) {
      return { status: "owner_must_transfer_first" };
    }
    try {
      await getAuth().api.deleteOrganization({
        headers: requestHeaders,
        body: { organizationId: session.householdId },
      });
    } catch {
      return { status: "failed" };
    }
    return { status: "ok", householdDeleted: true };
  }

  try {
    await getAuth().api.leaveOrganization({
      headers: requestHeaders,
      body: { organizationId: session.householdId },
    });
  } catch {
    return { status: "failed" };
  }

  // leaveOrganization runs no organizationHooks (docs/runbooks/households.md,
  // "Active household resolution"): it only clears the leaving session's own
  // activeOrganizationId. Clear the same user's other sessions too, mirroring
  // afterRemoveMember in auth/options.ts, instead of waiting for each of
  // their next getCurrentSession() re-validation to self-correct.
  await db
    .update(sessionTable)
    .set({ activeOrganizationId: null })
    .where(
      and(
        eq(sessionTable.userId, session.userId),
        eq(sessionTable.activeOrganizationId, session.householdId),
      ),
    );

  return { status: "ok", householdDeleted: false };
}
