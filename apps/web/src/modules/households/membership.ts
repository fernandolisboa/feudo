import { APIError } from "better-auth/api";
import { and, count, eq, gt, isNotNull, ne, or } from "drizzle-orm";

import { clearActiveHouseholdOnSessions, getAuth, type CurrentSession } from "@/modules/auth";
import { invitation as invitationTable, member, organization } from "@/db/schema";

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
  deliveryFailedAt: Date | null;
};

// A single household-scoped Drizzle select, not Better Auth's own
// listInvitations joined against a second query for deliveryFailedAt: that
// endpoint doesn't return Feudo's own delivery-state columns anyway, so
// reading the table directly is both the only way to get them and one round
// trip instead of two.
export async function listPendingInvitations(
  session: HouseholdSession,
  db: Database,
): Promise<PendingInvitation[]> {
  const rows = await db
    .select({
      id: invitationTable.id,
      email: invitationTable.email,
      role: invitationTable.role,
      expiresAt: invitationTable.expiresAt,
      deliveryFailedAt: invitationTable.deliveryFailedAt,
    })
    .from(invitationTable)
    .where(
      and(
        eq(invitationTable.organizationId, session.householdId),
        eq(invitationTable.status, "pending"),
        gt(invitationTable.expiresAt, new Date()),
      ),
    );
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role as InvitableRole,
    expiresAt: row.expiresAt,
    deliveryFailedAt: row.deliveryFailedAt,
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

// A household is a small pool of people, not a mailing list: 20 invites in
// an hour is already generous headroom for onboarding a real household and
// keeps a compromised session from spraying invitation emails.
const INVITE_HOURLY_LIMIT = 20;
// Below this interval, a resend of the same invitation is refused
// (rate_limited) instead of firing another email: a double-click or a
// scripted retry loop must not outrun what a human resending by hand would
// ever do.
const RESEND_MIN_INTERVAL_MS = 60 * 1000;

// A row counts toward the ceiling if it was either created or last sent
// within the hour: createdAt alone would let an old invitation be resent
// indefinitely once it ages out of the window, since resend (resend: true)
// only ever bumps expiresAt on the existing row, never createdAt.
async function recentInvitationCount(db: Database, inviterId: string): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await db
    .select({ total: count() })
    .from(invitationTable)
    .where(
      and(
        eq(invitationTable.inviterId, inviterId),
        or(gt(invitationTable.createdAt, oneHourAgo), gt(invitationTable.lastSentAt, oneHourAgo)),
      ),
    );
  return row?.total ?? 0;
}

export type InviteMemberOutcome = Outcome<
  { invitationId: string },
  | "unauthenticated"
  | "not_allowed"
  | "already_a_member"
  | "already_invited"
  | "rate_limited"
  | "failed"
>;

export async function inviteMember(
  input: InviteMemberFormInput,
  session: HouseholdSession | null,
  db: Database,
  requestHeaders: Headers,
): Promise<InviteMemberOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }
  // Better Auth's own invitationLimit only counts pending invitations for
  // the household, and auth.api.* calls never traverse the rate limiter's
  // onRequest hook (docs/runbooks/auth.md) — a resend or a cancel-then-
  // reinvite loop can otherwise mint unlimited emails from one session.
  const recentCount = await recentInvitationCount(db, session.userId);
  if (recentCount >= INVITE_HOURLY_LIMIT) {
    return { status: "rate_limited" };
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

export type ResendInvitationOutcome = SimpleOutcome<
  "ok" | "unauthenticated" | "not_allowed" | "not_found" | "rate_limited" | "failed"
>;

// Used by PendingInvitationsTable's "Reenviar" action, offered when an
// invitation's deliveryFailedAt is set: reuses the pending row's own email
// and role instead of taking them from the caller, so this can only ever
// resend an invitation that already exists — never mint a new one under a
// different identity — and is subject to the same per-inviter hourly ceiling
// as a fresh invite (recentInvitationCount above), plus its own minimum
// interval (RESEND_MIN_INTERVAL_MS). Eligibility (status = 'pending',
// deliveryFailedAt set and expiresAt in the future) is required in the
// scoped select itself, not just checked in code, and re-checked
// immediately before the Better Auth call: a concurrent cancel of the same
// invitation between the two reads must refuse the resend (not_found),
// never resurrect a cancelled invite. The expiresAt check also matters on
// the first read: an already-expired row is invisible to Better Auth's own
// findPendingInvitation, so without it createInvitation would take the
// create branch and mint a second, unrelated invitation instead of erroring.
export async function resendInvitation(
  invitationId: string,
  session: HouseholdSession | null,
  db: Database,
  requestHeaders: Headers,
): Promise<ResendInvitationOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }

  const rows = await db
    .select({
      email: invitationTable.email,
      role: invitationTable.role,
      lastSentAt: invitationTable.lastSentAt,
    })
    .from(invitationTable)
    .where(
      and(
        eq(invitationTable.id, invitationId),
        eq(invitationTable.organizationId, session.householdId),
        eq(invitationTable.status, "pending"),
        isNotNull(invitationTable.deliveryFailedAt),
        gt(invitationTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const existing = rows[0];
  if (!existing || !existing.role) {
    return { status: "not_found" };
  }

  if (existing.lastSentAt && Date.now() - existing.lastSentAt.getTime() < RESEND_MIN_INTERVAL_MS) {
    return { status: "rate_limited" };
  }

  const recentCount = await recentInvitationCount(db, session.userId);
  if (recentCount >= INVITE_HOURLY_LIMIT) {
    return { status: "rate_limited" };
  }

  const [stillPending] = await db
    .select({ status: invitationTable.status })
    .from(invitationTable)
    .where(eq(invitationTable.id, invitationId))
    .limit(1);
  if (stillPending?.status !== "pending") {
    return { status: "not_found" };
  }

  try {
    await getAuth().api.createInvitation({
      headers: requestHeaders,
      body: {
        email: existing.email,
        role: existing.role as InvitableRole,
        organizationId: session.householdId,
        resend: true,
      },
    });
  } catch (error) {
    const code = apiErrorCode(error);
    if (
      code === "YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION" ||
      code === "YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE"
    ) {
      return { status: "not_allowed" };
    }
    return { status: "failed" };
  }

  // Better Auth's own resend path (crud-invites.mjs) looks up the target row
  // by email + organization, not by id: if a second pending invitation for
  // this email somehow exists (a genuine race past the "already invited"
  // guard), it can update the wrong row. A stray row appearing for this
  // email after the call means this resend never touched invitationId — it
  // is cancelled here and reported as not_found rather than a false "ok".
  const strayRows = await db
    .select({ id: invitationTable.id })
    .from(invitationTable)
    .where(
      and(
        eq(invitationTable.organizationId, session.householdId),
        eq(invitationTable.email, existing.email),
        eq(invitationTable.status, "pending"),
        ne(invitationTable.id, invitationId),
        gt(invitationTable.expiresAt, new Date()),
      ),
    );
  if (strayRows.length > 0) {
    try {
      await Promise.all(
        strayRows.map((row) =>
          getAuth().api.cancelInvitation({
            headers: requestHeaders,
            body: { invitationId: row.id },
          }),
        ),
      );
    } catch {
      // A stray row was accepted or cancelled concurrently; either way it no
      // longer collides with this resend, so fall through to not_found below.
    }
    return { status: "not_found" };
  }

  const [after] = await db
    .select({ deliveryFailedAt: invitationTable.deliveryFailedAt })
    .from(invitationTable)
    .where(eq(invitationTable.id, invitationId))
    .limit(1);
  if (after?.deliveryFailedAt) {
    return { status: "failed" };
  }

  return { status: "ok" };
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
    // organizationHooks.beforeCancelInvitation (auth/options.ts) rejects a
    // cancel on an invitation that is no longer pending (already accepted
    // or rejected) — the caller sees the same "no longer exists" outcome as
    // a truly missing id, instead of a false "ok" that overwrote its status.
    if (error instanceof APIError && error.message === "invitation_not_pending") {
      return { status: "not_found" };
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

async function invitationPreviewFromDb(
  db: Database,
  invitationId: string,
): Promise<InvitationPreview | undefined> {
  const rows = await db
    .select({ role: invitationTable.role, householdName: organization.name })
    .from(invitationTable)
    .innerJoin(organization, eq(invitationTable.organizationId, organization.id))
    .where(eq(invitationTable.id, invitationId))
    .limit(1);
  const row = rows[0];
  if (!row?.role) {
    return undefined;
  }
  return { householdName: row.householdName, role: row.role as InvitableRole };
}

// Used by /convite/[id]: shows what a signed-in recipient is about to join
// before they confirm, without exposing anything to a stranger who guesses
// another recipient's invite id (getInvitation itself checks the session's
// email against the invitation's).
export async function getInvitationPreview(
  invitationId: string,
  session: CurrentSession | null,
  db: Database,
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
    if (code === "INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION") {
      // getInvitation already matched the session's email against the
      // invitation's and confirmed it is pending and unexpired before this
      // check ran — only the inviter's own membership is stale, and
      // acceptInvitation never re-checks it, so the invite is still good.
      const preview = await invitationPreviewFromDb(db, invitationId);
      if (preview) {
        return { status: "ok", ...preview };
      }
      return { status: "not_found" };
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

class TransferNotAllowedError extends Error {}
class TransferMemberNotFoundError extends Error {}
class TransferAlreadyOwnerError extends Error {}

export type TransferOwnershipOutcome = SimpleOutcome<
  "ok" | "unauthenticated" | "not_allowed" | "member_not_found" | "already_owner" | "failed"
>;

// Ownership never moves through the generic role-update endpoint
// (organizationHooks.beforeUpdateMemberRole rejects any "owner" role
// unconditionally) — this promotes and demotes in one database transaction
// instead (ADR-0001). The whole read-then-write runs inside the transaction,
// with `for update` locking every member row of the household, so a
// concurrent removal or leave of the target between the read and the write
// can never leave the household with zero owners: the lock makes that
// concurrent change wait until this transaction commits or rolls back, and
// the membership rows are re-read from inside the lock, not trusted from
// before it.
export async function transferOwnership(
  newOwnerMemberId: string,
  session: HouseholdSession | null,
  db: Database,
): Promise<TransferOwnershipOutcome> {
  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: member.id, userId: member.userId, role: member.role })
        .from(member)
        .where(eq(member.organizationId, session.householdId))
        .for("update");

      const currentOwner = rows.find(
        (row) => row.userId === session.userId && row.role === "owner",
      );
      if (!currentOwner) {
        throw new TransferNotAllowedError();
      }

      const target = rows.find((row) => row.id === newOwnerMemberId);
      if (!target) {
        throw new TransferMemberNotFoundError();
      }
      if (target.id === currentOwner.id) {
        throw new TransferAlreadyOwnerError();
      }

      // Demote first: the partial unique index on member (organization_id)
      // where role = 'owner' rejects a moment with two owner rows, but a
      // moment with zero is never checked, so this order never trips it.
      const demoted = await tx
        .update(member)
        .set({ role: "admin" })
        .where(eq(member.id, currentOwner.id))
        .returning({ id: member.id });
      if (demoted.length !== 1) {
        throw new Error("transfer_ownership_demote_failed");
      }

      const promoted = await tx
        .update(member)
        .set({ role: "owner" })
        .where(eq(member.id, target.id))
        .returning({ id: member.id });
      if (promoted.length !== 1) {
        throw new Error("transfer_ownership_promote_failed");
      }
    });
  } catch (error) {
    if (error instanceof TransferNotAllowedError) {
      return { status: "not_allowed" };
    }
    if (error instanceof TransferMemberNotFoundError) {
      return { status: "member_not_found" };
    }
    if (error instanceof TransferAlreadyOwnerError) {
      return { status: "already_owner" };
    }
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
    // This count is a fast-path UX check, not a guard: the row lock it
    // takes is released as soon as the inner transaction commits, and
    // `for update` blocks concurrent updates/deletes of those rows, never a
    // concurrent insert, so a member can still join between this count and
    // the deleteOrganization call below. The actual guard against erasing a
    // household that gained a member in that window is
    // beforeDeleteOrganization (auth/options.ts), which re-counts inside
    // the delete itself and rejects with household_has_other_members —
    // mapped to owner_must_transfer_first below.
    const isSoleMember = await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: member.id })
        .from(member)
        .where(eq(member.organizationId, session.householdId))
        .for("update");
      return rows.length === 1;
    });
    if (!isSoleMember) {
      return { status: "owner_must_transfer_first" };
    }
    try {
      await getAuth().api.deleteOrganization({
        headers: requestHeaders,
        body: { organizationId: session.householdId },
      });
    } catch (error) {
      if (error instanceof APIError && error.message === "household_has_other_members") {
        return { status: "owner_must_transfer_first" };
      }
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
  await clearActiveHouseholdOnSessions(db, session.userId, session.householdId);

  return { status: "ok", householdDeleted: false };
}
