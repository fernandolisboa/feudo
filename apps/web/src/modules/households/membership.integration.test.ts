import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

const currentHeaders = vi.hoisted(() => ({ value: new Headers() }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(currentHeaders.value),
}));

import { withTestDb } from "@/db/test/harness";
import { invitation, member, organization, session as sessionTable } from "@/db/schema";
import { getAuth, getCurrentSession, type CurrentSession } from "@/modules/auth";
import { findLastFakeSentEmail } from "@/modules/auth/email/fake-email-repository";
import { fakeEmailSender } from "@/modules/auth/email/fake-sender";
import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";

import type { Database } from "@/db/client";
import {
  acceptInvitation,
  cancelInvitation,
  getInvitationPreview,
  inviteMember,
  leaveHousehold,
  listMembers,
  listMyPendingInvitations,
  listPendingInvitations,
  removeMember,
  resendInvitation,
  transferOwnership,
  updateMemberRole,
} from "./membership";
import type { HouseholdSession } from "./require-household-session";
import { createHousehold } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
  currentHeaders.value = new Headers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function sessionFor(headers: Headers): Promise<CurrentSession | null> {
  currentHeaders.value = headers;
  return getCurrentSession();
}

async function householdSessionFor(headers: Headers): Promise<HouseholdSession> {
  const session = await sessionFor(headers);
  if (!session?.householdId) {
    throw new Error("expected a session with an active household in test setup");
  }
  return session as HouseholdSession;
}

async function createOwnerWithHousehold(
  db: Database,
  name: string,
  email: string,
  householdName: string,
): Promise<{ headers: Headers; householdId: string; userId: string }> {
  const headers = await signUpVerifiedUser(db, { name, email, password: "correct-horse" });
  const session = await sessionFor(headers);
  const outcome = await createHousehold(
    { name: householdName, timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
    session,
    db,
    headers,
  );
  if (outcome.status !== "ok") {
    throw new Error(`household creation failed in test setup: ${outcome.status}`);
  }
  const rawSession = await getAuth().api.getSession({ headers });
  if (!rawSession) {
    throw new Error("owner sign-in failed in test setup");
  }
  return { headers, householdId: outcome.householdId, userId: rawSession.user.id };
}

async function addMemberDirect(
  db: Database,
  householdId: string,
  role: "admin" | "member",
): Promise<{ headers: Headers; userId: string; memberId: string }> {
  const suffix = crypto.randomUUID();
  const memberHeaders = await signUpVerifiedUser(db, {
    name: `Member ${suffix}`,
    email: `member-${suffix}@example.com`,
    password: "correct-horse",
  });
  const memberSession = await getAuth().api.getSession({ headers: memberHeaders });
  if (!memberSession) {
    throw new Error("member sign-in failed in test setup");
  }
  const created = await getAuth().api.addMember({
    body: { userId: memberSession.user.id, organizationId: householdId, role },
  });
  return { headers: memberHeaders, userId: memberSession.user.id, memberId: created.id };
}

async function ownerMemberId(db: Database, householdId: string): Promise<string> {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, householdId), eq(member.role, "owner")));
  if (!row) {
    throw new Error("owner member row not found in test setup");
  }
  return row.id;
}

const SINGLE_OWNER_SQLSTATE = "23514";

function sqlStateOf(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current === "object" && current !== null && "code" in current) {
      const code = (current as { code?: unknown }).code;
      if (typeof code === "string") {
        return code;
      }
    }
    if (typeof current !== "object" || current === null || !("cause" in current)) {
      return undefined;
    }
    current = current.cause;
  }
  return undefined;
}

describe("inviteMember (integration)", () => {
  it("sends an invitation email and creates a pending invite", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "invite-owner@example.com", "Casa");
      const session = await householdSessionFor(owner.headers);

      const outcome = await inviteMember(
        { email: "friend@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(outcome.status).toBe("ok");

      const sent = await findLastFakeSentEmail(db, "friend@example.com");
      expect(sent).toBeDefined();
      expect(sent?.text).toContain("Casa");

      const invites = await listPendingInvitations(session, db);
      expect(invites).toHaveLength(1);
      expect(invites[0]).toMatchObject({ email: "friend@example.com", role: "member" });
    });
  });

  it("refuses to invite someone who is already a member", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "already-member@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      const existingMember = await addMemberDirect(db, owner.householdId, "member");
      const existingSession = await getAuth().api.getSession({
        headers: existingMember.headers,
      });
      if (!existingSession) throw new Error("member sign-in failed in test setup");

      const outcome = await inviteMember(
        { email: existingSession.user.email, role: "admin" },
        session,
        db,
        owner.headers,
      );
      expect(outcome.status).toBe("already_a_member");
    });
  });

  it("refuses a second invite to the same pending email", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "dup-invite@example.com", "Casa");
      const session = await householdSessionFor(owner.headers);

      await inviteMember({ email: "dup@example.com", role: "member" }, session, db, owner.headers);
      const second = await inviteMember(
        { email: "dup@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(second.status).toBe("already_invited");
    });
  });

  it("refuses to let a plain member invite anyone", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "member-invite@example.com",
        "Casa",
      );
      const plainMember = await addMemberDirect(db, owner.householdId, "member");
      const memberSession = await householdSessionFor(plainMember.headers);

      const outcome = await inviteMember(
        { email: "someone@example.com", role: "member" },
        memberSession,
        db,
        plainMember.headers,
      );
      expect(outcome.status).toBe("not_allowed");
    });
  });
});

describe("cancelInvitation (integration)", () => {
  it("cancels a pending invite", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "cancel-owner@example.com", "Casa");
      const session = await householdSessionFor(owner.headers);
      const invited = await inviteMember(
        { email: "cancel-me@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      if (invited.status !== "ok") throw new Error("invite failed in test setup");

      const outcome = await cancelInvitation(invited.invitationId, session, owner.headers);
      expect(outcome.status).toBe("ok");

      const [row] = await db
        .select({ status: invitation.status })
        .from(invitation)
        .where(eq(invitation.id, invited.invitationId));
      expect(row?.status).toBe("canceled");
    });
  });
});

describe("acceptInvitation (integration)", () => {
  it("joins the household and sets it active on the invitee's session", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "accept-owner@example.com", "Casa");
      const ownerSession = await householdSessionFor(owner.headers);
      const invited = await inviteMember(
        { email: "invitee@example.com", role: "admin" },
        ownerSession,
        db,
        owner.headers,
      );
      if (invited.status !== "ok") throw new Error("invite failed in test setup");

      const inviteeHeaders = await signUpVerifiedUser(db, {
        name: "Invitee",
        email: "invitee@example.com",
        password: "correct-horse",
      });
      const inviteeSession = await sessionFor(inviteeHeaders);

      const outcome = await acceptInvitation(invited.invitationId, inviteeSession, inviteeHeaders);
      expect(outcome.status).toBe("ok");
      if (outcome.status !== "ok") return;
      expect(outcome.householdId).toBe(owner.householdId);

      const afterAccept = await sessionFor(inviteeHeaders);
      expect(afterAccept?.householdId).toBe(owner.householdId);

      const members = await listMembers(ownerSession, owner.headers);
      const joined = members.find((row) => row.email === "invitee@example.com");
      expect(joined?.role).toBe("admin");
    });
  });

  it("refuses to accept an invite addressed to a different email", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "wrong-email-owner@example.com",
        "Casa",
      );
      const ownerSession = await householdSessionFor(owner.headers);
      const invited = await inviteMember(
        { email: "correct@example.com", role: "member" },
        ownerSession,
        db,
        owner.headers,
      );
      if (invited.status !== "ok") throw new Error("invite failed in test setup");

      const strangerHeaders = await signUpVerifiedUser(db, {
        name: "Stranger",
        email: "stranger@example.com",
        password: "correct-horse",
      });
      const strangerSession = await sessionFor(strangerHeaders);

      const outcome = await acceptInvitation(
        invited.invitationId,
        strangerSession,
        strangerHeaders,
      );
      expect(outcome.status).toBe("wrong_email");
    });
  });

  it("lists a pending invite for the invitee before they accept it", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "list-mine-owner@example.com",
        "Casa",
      );
      const ownerSession = await householdSessionFor(owner.headers);
      await inviteMember(
        { email: "future-member@example.com", role: "member" },
        ownerSession,
        db,
        owner.headers,
      );

      const inviteeHeaders = await signUpVerifiedUser(db, {
        name: "Future Member",
        email: "future-member@example.com",
        password: "correct-horse",
      });

      const invites = await listMyPendingInvitations(inviteeHeaders);
      expect(invites).toHaveLength(1);
      expect(invites[0]).toMatchObject({ householdName: "Casa", role: "member" });
    });
  });
});

describe("removeMember (integration)", () => {
  it("lets an admin remove a plain member and clears their stale session", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "remove-owner@example.com", "Casa");
      const admin = await addMemberDirect(db, owner.householdId, "admin");
      const plainMember = await addMemberDirect(db, owner.householdId, "member");
      const adminSession = await householdSessionFor(admin.headers);

      const memberRawSession = await getAuth().api.getSession({ headers: plainMember.headers });
      if (!memberRawSession) throw new Error("member sign-in failed in test setup");

      const outcome = await removeMember(plainMember.memberId, adminSession, admin.headers);
      expect(outcome.status).toBe("ok");

      const [row] = await db
        .select({ activeOrganizationId: sessionTable.activeOrganizationId })
        .from(sessionTable)
        .where(eq(sessionTable.id, memberRawSession.session.id));
      expect(row?.activeOrganizationId).toBeNull();
    });
  });

  it("never removes the owner", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "cant-remove-owner@example.com",
        "Casa",
      );
      const admin = await addMemberDirect(db, owner.householdId, "admin");
      const adminSession = await householdSessionFor(admin.headers);

      const outcome = await removeMember(
        await ownerMemberId(db, owner.householdId),
        adminSession,
        admin.headers,
      );
      expect(outcome.status).toBe("cannot_remove_owner");
    });
  });

  it("refuses to let a plain member remove anyone", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "member-cant-remove@example.com",
        "Casa",
      );
      const target = await addMemberDirect(db, owner.householdId, "member");
      const actingMember = await addMemberDirect(db, owner.householdId, "member");
      const actingSession = await householdSessionFor(actingMember.headers);

      const outcome = await removeMember(target.memberId, actingSession, actingMember.headers);
      expect(outcome.status).toBe("not_allowed");
    });
  });
});

describe("updateMemberRole (integration)", () => {
  it("lets an admin promote a plain member to admin", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "promote-owner@example.com",
        "Casa",
      );
      const admin = await addMemberDirect(db, owner.householdId, "admin");
      const plainMember = await addMemberDirect(db, owner.householdId, "member");
      const adminSession = await householdSessionFor(admin.headers);

      const outcome = await updateMemberRole(
        { memberId: plainMember.memberId, role: "admin" },
        adminSession,
        admin.headers,
      );
      expect(outcome.status).toBe("ok");

      const members = await listMembers(adminSession, admin.headers);
      const promoted = members.find((row) => row.id === plainMember.memberId);
      expect(promoted?.role).toBe("admin");
    });
  });
});

describe("transferOwnership (integration)", () => {
  it("promotes the target and demotes the current owner in one operation", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "transfer-owner@example.com",
        "Casa",
      );
      const admin = await addMemberDirect(db, owner.householdId, "admin");
      const ownerSession = await householdSessionFor(owner.headers);

      const outcome = await transferOwnership(admin.memberId, ownerSession, db);
      expect(outcome.status).toBe("ok");

      const rows = await db
        .select({ userId: member.userId, role: member.role })
        .from(member)
        .where(eq(member.organizationId, owner.householdId));
      const owners = rows.filter((row) => row.role === "owner");
      expect(owners).toHaveLength(1);
      expect(owners[0]?.userId).toBe(admin.userId);

      const formerOwner = rows.find((row) => row.userId === owner.userId);
      expect(formerOwner?.role).toBe("admin");
    });
  });

  it("refuses to let a non-owner transfer ownership", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "non-owner-transfer@example.com",
        "Casa",
      );
      const admin = await addMemberDirect(db, owner.householdId, "admin");
      const target = await addMemberDirect(db, owner.householdId, "member");
      const adminSession = await householdSessionFor(admin.headers);

      const outcome = await transferOwnership(target.memberId, adminSession, db);
      expect(outcome.status).toBe("not_allowed");
    });
  });
});

describe("leaveHousehold (integration)", () => {
  it("lets a plain member leave", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "leave-owner@example.com", "Casa");
      const plainMember = await addMemberDirect(db, owner.householdId, "member");
      const memberSession = await householdSessionFor(plainMember.headers);

      const outcome = await leaveHousehold(memberSession, db, plainMember.headers);
      expect(outcome.status).toBe("ok");
      if (outcome.status !== "ok") return;
      expect(outcome.householdDeleted).toBe(false);

      const rows = await db
        .select({ id: member.id })
        .from(member)
        .where(eq(member.userId, plainMember.userId));
      expect(rows).toHaveLength(0);
    });
  });

  it("refuses to let the owner leave while other members remain", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "owner-cant-leave@example.com",
        "Casa",
      );
      await addMemberDirect(db, owner.householdId, "member");
      const ownerSession = await householdSessionFor(owner.headers);

      const outcome = await leaveHousehold(ownerSession, db, owner.headers);
      expect(outcome.status).toBe("owner_must_transfer_first");
    });
  });

  it("deletes the household when its last member (the owner) leaves", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "last-member@example.com", "Casa");
      const ownerSession = await householdSessionFor(owner.headers);

      const outcome = await leaveHousehold(ownerSession, db, owner.headers);
      expect(outcome.status).toBe("ok");
      if (outcome.status !== "ok") return;
      expect(outcome.householdDeleted).toBe(true);

      const rows = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.id, owner.householdId));
      expect(rows).toHaveLength(0);
    });
  });
});

describe("cross-household isolation (integration)", () => {
  it("refuses to let a household A member invite, cancel, remove or transfer in household B", async () => {
    await withTestDb(async (db) => {
      const householdA = await createOwnerWithHousehold(
        db,
        "Owner A",
        "owner-a@example.com",
        "Casa A",
      );
      const householdB = await createOwnerWithHousehold(
        db,
        "Owner B",
        "owner-b@example.com",
        "Casa B",
      );
      const sessionA = await householdSessionFor(householdA.headers);
      const sessionBOwner = await householdSessionFor(householdB.headers);

      const memberOfB = await addMemberDirect(db, householdB.householdId, "member");

      const invitedInB = await inviteMember(
        { email: "target-in-b@example.com", role: "member" },
        sessionBOwner,
        db,
        householdB.headers,
      );
      if (invitedInB.status !== "ok") throw new Error("invite failed in test setup");

      // Household A's owner tries to act on household B's invitation and
      // member ids, using their own (household A) session headers.
      const cancelOutcome = await cancelInvitation(
        invitedInB.invitationId,
        sessionA,
        householdA.headers,
      );
      expect(cancelOutcome.status).toBe("not_found");

      const removeOutcome = await removeMember(memberOfB.memberId, sessionA, householdA.headers);
      expect(removeOutcome.status).toBe("not_found");

      const transferOutcome = await transferOwnership(memberOfB.memberId, sessionA, db);
      expect(transferOutcome.status).toBe("member_not_found");

      const roleOutcome = await updateMemberRole(
        { memberId: memberOfB.memberId, role: "admin" },
        sessionA,
        householdA.headers,
      );
      expect(roleOutcome.status).toBe("not_allowed");

      // The invitation and membership in household B are untouched.
      const [invitationRow] = await db
        .select({ status: invitation.status })
        .from(invitation)
        .where(eq(invitation.id, invitedInB.invitationId));
      expect(invitationRow?.status).toBe("pending");

      const [memberRow] = await db
        .select({ role: member.role })
        .from(member)
        .where(eq(member.id, memberOfB.memberId));
      expect(memberRow?.role).toBe("member");
    });
  });
});

describe("inviteMember rate limiting (integration)", () => {
  // 20 invite+cancel round trips against a real, remote Postgres project
  // comfortably outrun the suite's 20s default (vitest.integration.config.mts).
  it(
    "refuses the 21st invite from the same inviter within an hour",
    { timeout: 60_000 },
    async () => {
      await withTestDb(async (db) => {
        const owner = await createOwnerWithHousehold(
          db,
          "Owner",
          "invite-limit-owner@example.com",
          "Casa",
        );
        const session = await householdSessionFor(owner.headers);

        // Cancelled immediately after creation, not left pending: Better
        // Auth's own invitationLimit (organization({ invitationLimit: 10 }))
        // caps pending invitations per household, independent of this test's
        // own per-inviter, any-status hourly count (recentInvitationCount in
        // membership.ts) — leaving all 20 pending would hit that cap first.
        for (let index = 0; index < 20; index += 1) {
          const outcome = await inviteMember(
            {
              email: `invitee-${index.toString()}-${crypto.randomUUID()}@example.com`,
              role: "member",
            },
            session,
            db,
            owner.headers,
          );
          expect(outcome.status).toBe("ok");
          if (outcome.status === "ok") {
            await cancelInvitation(outcome.invitationId, session, owner.headers);
          }
        }

        const outcome = await inviteMember(
          { email: `invitee-overflow-${crypto.randomUUID()}@example.com`, role: "member" },
          session,
          db,
          owner.headers,
        );
        expect(outcome.status).toBe("rate_limited");
      });
    },
  );
});

describe("transferOwnership regression (integration)", () => {
  it("refuses the transfer, leaving exactly one owner, when the target was already removed", async () => {
    // This runs removeMember() to completion before calling transferOwnership(),
    // so it is a plain sequential regression check, not a race: it would pass
    // even without the `for update` lock inside transferOwnership's own
    // transaction, which is what actually guards against a target removed
    // mid-transfer. A real interleaving test needs two overlapping
    // transactions and isn't done here.
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "transfer-race-owner@example.com",
        "Casa",
      );
      const target = await addMemberDirect(db, owner.householdId, "admin");
      const ownerSession = await householdSessionFor(owner.headers);

      await removeMember(target.memberId, ownerSession, owner.headers);

      const outcome = await transferOwnership(target.memberId, ownerSession, db);
      expect(outcome.status).toBe("member_not_found");

      const rows = await db
        .select({ userId: member.userId, role: member.role })
        .from(member)
        .where(eq(member.organizationId, owner.householdId));
      const owners = rows.filter((row) => row.role === "owner");
      expect(owners).toHaveLength(1);
      expect(owners[0]?.userId).toBe(owner.userId);
    });
  });
});

describe("cancelInvitation after acceptance (integration)", () => {
  it("reports the invitation as no longer cancellable instead of overwriting its status", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "cancel-after-accept@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      const invited = await inviteMember(
        { email: "already-accepted@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      if (invited.status !== "ok") throw new Error("invite failed in test setup");

      const inviteeHeaders = await signUpVerifiedUser(db, {
        name: "Already Accepted",
        email: "already-accepted@example.com",
        password: "correct-horse",
      });
      const inviteeSession = await sessionFor(inviteeHeaders);
      const acceptOutcome = await acceptInvitation(
        invited.invitationId,
        inviteeSession,
        inviteeHeaders,
      );
      expect(acceptOutcome.status).toBe("ok");

      const cancelOutcome = await cancelInvitation(invited.invitationId, session, owner.headers);
      expect(cancelOutcome.status).toBe("not_found");

      const [row] = await db
        .select({ status: invitation.status })
        .from(invitation)
        .where(eq(invitation.id, invited.invitationId));
      expect(row?.status).toBe("accepted");
    });
  });
});

describe("expired invitations (integration)", () => {
  async function expireInvitation(db: Database, invitationId: string): Promise<void> {
    await db
      .update(invitation)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(invitation.id, invitationId));
  }

  it("refuses to accept an expired invitation independently of the daily prune", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "expired-accept-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      const invited = await inviteMember(
        { email: "expired-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      if (invited.status !== "ok") throw new Error("invite failed in test setup");
      await expireInvitation(db, invited.invitationId);

      const inviteeHeaders = await signUpVerifiedUser(db, {
        name: "Expired Invitee",
        email: "expired-invitee@example.com",
        password: "correct-horse",
      });
      const inviteeSession = await sessionFor(inviteeHeaders);

      const outcome = await acceptInvitation(invited.invitationId, inviteeSession, inviteeHeaders);
      expect(outcome.status).toBe("not_found");
    });
  });

  it("refuses to preview an expired invitation independently of the daily prune", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "expired-preview-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      const invited = await inviteMember(
        { email: "expired-preview-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      if (invited.status !== "ok") throw new Error("invite failed in test setup");
      await expireInvitation(db, invited.invitationId);

      const inviteeHeaders = await signUpVerifiedUser(db, {
        name: "Expired Preview Invitee",
        email: "expired-preview-invitee@example.com",
        password: "correct-horse",
      });
      const inviteeSession = await sessionFor(inviteeHeaders);

      const outcome = await getInvitationPreview(
        invited.invitationId,
        inviteeSession,
        db,
        inviteeHeaders,
      );
      expect(outcome.status).toBe("not_found");
    });
  });

  it("excludes an expired invitation from the household's pending list", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "expired-list-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      const invited = await inviteMember(
        { email: "expired-list-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      if (invited.status !== "ok") throw new Error("invite failed in test setup");
      await expireInvitation(db, invited.invitationId);

      const invites = await listPendingInvitations(session, db);
      expect(invites).toHaveLength(0);
    });
  });
});

describe("getInvitationPreview when the inviter has left (integration)", () => {
  it("still renders the household name and role for a valid, unexpired invite", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "inviter-left-owner@example.com",
        "Casa",
      );
      const admin = await addMemberDirect(db, owner.householdId, "admin");
      const adminSession = await householdSessionFor(admin.headers);
      const invited = await inviteMember(
        { email: "inviter-left-invitee@example.com", role: "member" },
        adminSession,
        db,
        admin.headers,
      );
      if (invited.status !== "ok") throw new Error("invite failed in test setup");

      const ownerSession = await householdSessionFor(owner.headers);
      const removeOutcome = await removeMember(admin.memberId, ownerSession, owner.headers);
      expect(removeOutcome.status).toBe("ok");

      const inviteeHeaders = await signUpVerifiedUser(db, {
        name: "Inviter Left Invitee",
        email: "inviter-left-invitee@example.com",
        password: "correct-horse",
      });
      const inviteeSession = await sessionFor(inviteeHeaders);

      const outcome = await getInvitationPreview(
        invited.invitationId,
        inviteeSession,
        db,
        inviteeHeaders,
      );
      expect(outcome.status).toBe("ok");
      if (outcome.status !== "ok") return;
      expect(outcome.householdName).toBe("Casa");
      expect(outcome.role).toBe("member");
    });
  });
});

describe("zero-owner race (integration)", () => {
  // Reproduces the race described in ADR-0001/docs/runbooks/households.md:
  // Better Auth's /organization/remove-member reads the target's role with a
  // plain SELECT (no lock) and only takes a row lock on the DELETE that
  // follows. This drives the same shape by hand against the member table —
  // a plain read, a pause, then a delete — while transferOwnership runs and
  // commits in between, so the delete lands on the row that is now the
  // household's sole owner. member_single_owner_trigger (0007) is the only
  // thing standing between that delete and a household with zero owners.
  it("rolls back a delete that would remove the household's only owner mid-transfer", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "race-owner@example.com", "Casa");
      const target = await addMemberDirect(db, owner.householdId, "admin");
      const ownerSession = await householdSessionFor(owner.headers);

      let releaseRemove: (() => void) | undefined;
      const removeCanProceed = new Promise<void>((resolve) => {
        releaseRemove = resolve;
      });
      let markRoleChecked: (() => void) | undefined;
      const roleChecked = new Promise<void>((resolve) => {
        markRoleChecked = resolve;
      });

      const removeAttempt = db
        .transaction(async (tx) => {
          try {
            const [row] = await tx
              .select({ role: member.role })
              .from(member)
              .where(eq(member.id, target.memberId));
            expect(row?.role).toBe("admin");
          } finally {
            markRoleChecked?.();
          }
          await removeCanProceed;
          await tx.delete(member).where(eq(member.id, target.memberId));
        })
        .then(() => undefined)
        .catch((error: unknown) => error);

      await roleChecked;
      const transferOutcome = await transferOwnership(target.memberId, ownerSession, db);
      expect(transferOutcome.status).toBe("ok");
      releaseRemove?.();

      const removeResult = await removeAttempt;
      expect(removeResult).toBeDefined();
      expect(sqlStateOf(removeResult)).toBe(SINGLE_OWNER_SQLSTATE);

      const rows = await db
        .select({ userId: member.userId, role: member.role })
        .from(member)
        .where(eq(member.organizationId, owner.householdId));
      const owners = rows.filter((row) => row.role === "owner");
      expect(owners).toHaveLength(1);
      expect(owners[0]?.userId).toBe(target.userId);
    });
  });

  it("still transfers, leaves, removes and deletes the last-member household sequentially", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "race-sequential-owner@example.com",
        "Casa",
      );
      const admin = await addMemberDirect(db, owner.householdId, "admin");
      const plainMember = await addMemberDirect(db, owner.householdId, "member");
      const ownerSession = await householdSessionFor(owner.headers);

      const transferOutcome = await transferOwnership(admin.memberId, ownerSession, db);
      expect(transferOutcome.status).toBe("ok");

      const newOwnerSession = await householdSessionFor(admin.headers);
      const removeOutcome = await removeMember(
        plainMember.memberId,
        newOwnerSession,
        admin.headers,
      );
      expect(removeOutcome.status).toBe("ok");

      const formerOwnerSession = await householdSessionFor(owner.headers);
      const leaveOutcome = await leaveHousehold(formerOwnerSession, db, owner.headers);
      expect(leaveOutcome.status).toBe("ok");
      if (leaveOutcome.status !== "ok") return;
      expect(leaveOutcome.householdDeleted).toBe(false);

      const lastLeaveOutcome = await leaveHousehold(newOwnerSession, db, admin.headers);
      expect(lastLeaveOutcome.status).toBe("ok");
      if (lastLeaveOutcome.status !== "ok") return;
      expect(lastLeaveOutcome.householdDeleted).toBe(true);
    });
  });
});

describe("invitation delivery failure (integration)", () => {
  it("records a delivery failure when the invitation email fails to send", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "delivery-failure-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));

      const invited = await inviteMember(
        { email: "delivery-failure-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(invited.status).toBe("ok");
      if (invited.status !== "ok") return;

      const [row] = await db
        .select({ deliveryFailedAt: invitation.deliveryFailedAt })
        .from(invitation)
        .where(eq(invitation.id, invited.invitationId));
      expect(row?.deliveryFailedAt).not.toBeNull();

      const invites = await listPendingInvitations(session, db);
      expect(
        invites.find((entry) => entry.id === invited.invitationId)?.deliveryFailedAt,
      ).not.toBeNull();
    });
  });

  it("clears the delivery failure on a successful resend", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "delivery-resend-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));

      const invited = await inviteMember(
        { email: "delivery-resend-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(invited.status).toBe("ok");
      if (invited.status !== "ok") return;

      // The initial send's own failure already set lastSentAt; push it
      // outside the minimum interval so this resend reaches the provider
      // instead of short-circuiting on rate_limited.
      await db
        .update(invitation)
        .set({ lastSentAt: new Date(Date.now() - 2 * 60 * 1000) })
        .where(eq(invitation.id, invited.invitationId));

      const resendOutcome = await resendInvitation(
        invited.invitationId,
        session,
        db,
        owner.headers,
      );
      expect(resendOutcome.status).toBe("ok");

      const [row] = await db
        .select({ deliveryFailedAt: invitation.deliveryFailedAt })
        .from(invitation)
        .where(eq(invitation.id, invited.invitationId));
      expect(row?.deliveryFailedAt).toBeNull();
    });
  });

  it("refuses to let another household resend an invitation that isn't theirs", async () => {
    await withTestDb(async (db) => {
      const householdA = await createOwnerWithHousehold(
        db,
        "Owner A",
        "delivery-isolation-a@example.com",
        "Casa A",
      );
      const householdB = await createOwnerWithHousehold(
        db,
        "Owner B",
        "delivery-isolation-b@example.com",
        "Casa B",
      );
      const sessionA = await householdSessionFor(householdA.headers);
      const sessionB = await householdSessionFor(householdB.headers);
      vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));

      const invited = await inviteMember(
        { email: "delivery-isolation-invitee@example.com", role: "member" },
        sessionA,
        db,
        householdA.headers,
      );
      expect(invited.status).toBe("ok");
      if (invited.status !== "ok") return;

      const crossHouseholdResend = await resendInvitation(
        invited.invitationId,
        sessionB,
        db,
        householdB.headers,
      );
      expect(crossHouseholdResend.status).toBe("not_found");

      const [row] = await db
        .select({ deliveryFailedAt: invitation.deliveryFailedAt })
        .from(invitation)
        .where(eq(invitation.id, invited.invitationId));
      expect(row?.deliveryFailedAt).not.toBeNull();
    });
  });

  it("ignores an expired stray row for the same email and leaves it untouched", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "resend-expired-stray-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      const inviteeEmail = "resend-expired-stray-invitee@example.com";
      vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));

      const invited = await inviteMember(
        { email: inviteeEmail, role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(invited.status).toBe("ok");
      if (invited.status !== "ok") return;

      const expiredInvitationId = crypto.randomUUID();
      await db.insert(invitation).values({
        id: expiredInvitationId,
        organizationId: owner.householdId,
        email: inviteeEmail,
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() - 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        inviterId: owner.userId,
      });

      // The initial send's own failure already set lastSentAt on the
      // target row; push it outside the minimum interval so this resend
      // reaches the stray-row lookup instead of short-circuiting on
      // rate_limited.
      await db
        .update(invitation)
        .set({ lastSentAt: new Date(Date.now() - 2 * 60 * 1000) })
        .where(eq(invitation.id, invited.invitationId));

      const resendOutcome = await resendInvitation(
        invited.invitationId,
        session,
        db,
        owner.headers,
      );
      expect(resendOutcome.status).toBe("ok");

      const [expiredRow] = await db
        .select({ status: invitation.status, expiresAt: invitation.expiresAt })
        .from(invitation)
        .where(eq(invitation.id, expiredInvitationId));
      expect(expiredRow?.status).toBe("pending");
      expect(expiredRow?.expiresAt.getTime()).toBeLessThan(Date.now());
    });
  });
});

describe("resendInvitation ceiling and eligibility (integration)", () => {
  it("refuses to resend an invitation that never failed to send", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "resend-healthy-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);

      const invited = await inviteMember(
        { email: "resend-healthy-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(invited.status).toBe("ok");
      if (invited.status !== "ok") return;

      const resendOutcome = await resendInvitation(
        invited.invitationId,
        session,
        db,
        owner.headers,
      );
      expect(resendOutcome.status).toBe("not_found");
    });
  });

  it("refuses a resend within the minimum interval of the invitation's own last successful send", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "resend-min-interval-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));

      const invited = await inviteMember(
        { email: "resend-min-interval-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(invited.status).toBe("ok");
      if (invited.status !== "ok") return;

      // Simulates a resend that landed moments ago: lastSentAt is set on
      // every send attempt (auth/options.ts's sendInvitationEmail), success
      // or failure, so this seeds the state a real double-click would
      // produce without depending on real wall-clock delay in the test.
      await db
        .update(invitation)
        .set({ lastSentAt: new Date() })
        .where(eq(invitation.id, invited.invitationId));

      const resendOutcome = await resendInvitation(
        invited.invitationId,
        session,
        db,
        owner.headers,
      );
      expect(resendOutcome.status).toBe("rate_limited");
    });
  });

  it(
    "still counts an invitation with an old createdAt toward the hourly ceiling once it has been resent",
    { timeout: 60_000 },
    async () => {
      await withTestDb(async (db) => {
        const owner = await createOwnerWithHousehold(
          db,
          "Owner",
          "resend-ceiling-owner@example.com",
          "Casa",
        );
        const session = await householdSessionFor(owner.headers);
        vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));

        const invited = await inviteMember(
          { email: "resend-ceiling-invitee@example.com", role: "member" },
          session,
          db,
          owner.headers,
        );
        expect(invited.status).toBe("ok");
        if (invited.status !== "ok") return;

        // Pushed outside the hourly window on createdAt alone: only a recent
        // lastSentAt (set by the resend below) can keep this row counting
        // toward recentInvitationCount's ceiling. lastSentAt is also pushed
        // outside the 60s minimum interval (the initial send's own failure
        // already set it) so the resend below reaches the provider instead
        // of short-circuiting on rate_limited.
        await db
          .update(invitation)
          .set({
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            lastSentAt: new Date(Date.now() - 2 * 60 * 1000),
          })
          .where(eq(invitation.id, invited.invitationId));

        const resendOutcome = await resendInvitation(
          invited.invitationId,
          session,
          db,
          owner.headers,
        );
        expect(resendOutcome.status).toBe("ok");

        // 19 more, cancelled immediately (Better Auth's own invitationLimit
        // caps pending invitations per household, independent of this
        // per-inviter hourly count) — combined with the aged-but-resent
        // invitation above, that is 20 rows recentInvitationCount should
        // count as recent; a 21st fails only if the aged row still counts.
        for (let index = 0; index < 19; index += 1) {
          const outcome = await inviteMember(
            {
              email: `resend-ceiling-${index.toString()}-${crypto.randomUUID()}@example.com`,
              role: "member",
            },
            session,
            db,
            owner.headers,
          );
          expect(outcome.status).toBe("ok");
          if (outcome.status === "ok") {
            await cancelInvitation(outcome.invitationId, session, owner.headers);
          }
        }

        const overflow = await inviteMember(
          { email: `resend-ceiling-overflow-${crypto.randomUUID()}@example.com`, role: "member" },
          session,
          db,
          owner.headers,
        );
        expect(overflow.status).toBe("rate_limited");
      });
    },
  );

  it(
    "still counts an invitation with an old createdAt toward the hourly ceiling when only its send has failed",
    { timeout: 60_000 },
    async () => {
      await withTestDb(async (db) => {
        const owner = await createOwnerWithHousehold(
          db,
          "Owner",
          "resend-ceiling-failed-owner@example.com",
          "Casa",
        );
        const session = await householdSessionFor(owner.headers);
        vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));

        const invited = await inviteMember(
          { email: "resend-ceiling-failed-invitee@example.com", role: "member" },
          session,
          db,
          owner.headers,
        );
        expect(invited.status).toBe("ok");
        if (invited.status !== "ok") return;

        // Pushed outside the hourly window on createdAt alone, and never
        // resent: only the initial send's own failure (which sets lastSentAt
        // in sendInvitationEmail's catch branch, not just on success) can
        // keep this row counting toward recentInvitationCount's ceiling.
        await db
          .update(invitation)
          .set({ createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) })
          .where(eq(invitation.id, invited.invitationId));

        for (let index = 0; index < 19; index += 1) {
          const outcome = await inviteMember(
            {
              email: `resend-ceiling-failed-${index.toString()}-${crypto.randomUUID()}@example.com`,
              role: "member",
            },
            session,
            db,
            owner.headers,
          );
          expect(outcome.status).toBe("ok");
          if (outcome.status === "ok") {
            await cancelInvitation(outcome.invitationId, session, owner.headers);
          }
        }

        const overflow = await inviteMember(
          {
            email: `resend-ceiling-failed-overflow-${crypto.randomUUID()}@example.com`,
            role: "member",
          },
          session,
          db,
          owner.headers,
        );
        expect(overflow.status).toBe("rate_limited");
      });
    },
  );

  it("reports failed when the resend's own send attempt also fails", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "resend-failed-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      vi.spyOn(fakeEmailSender, "send")
        .mockRejectedValueOnce(new Error("provider down"))
        .mockRejectedValueOnce(new Error("provider still down"));

      const invited = await inviteMember(
        { email: "resend-failed-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(invited.status).toBe("ok");
      if (invited.status !== "ok") return;

      // The initial send's own failure already set lastSentAt (every send
      // attempt writes it, success or failure); push it outside the minimum
      // interval so this resend reaches the provider for a genuine second
      // failure instead of short-circuiting on rate_limited.
      await db
        .update(invitation)
        .set({ lastSentAt: new Date(Date.now() - 2 * 60 * 1000) })
        .where(eq(invitation.id, invited.invitationId));

      const resendOutcome = await resendInvitation(
        invited.invitationId,
        session,
        db,
        owner.headers,
      );
      expect(resendOutcome.status).toBe("failed");

      const [row] = await db
        .select({ deliveryFailedAt: invitation.deliveryFailedAt })
        .from(invitation)
        .where(eq(invitation.id, invited.invitationId));
      expect(row?.deliveryFailedAt).not.toBeNull();
    });
  });

  it("refuses a resend within the minimum interval of a prior resend that itself failed", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "resend-after-failed-resend-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      vi.spyOn(fakeEmailSender, "send")
        .mockRejectedValueOnce(new Error("provider down"))
        .mockRejectedValueOnce(new Error("provider still down"));

      const invited = await inviteMember(
        { email: "resend-after-failed-resend-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(invited.status).toBe("ok");
      if (invited.status !== "ok") return;

      // The initial send's own failure already set lastSentAt; push it
      // outside the minimum interval so the first resend below reaches the
      // provider instead of short-circuiting on the interval it inherited
      // from the failed invite.
      await db
        .update(invitation)
        .set({ lastSentAt: new Date(Date.now() - 2 * 60 * 1000) })
        .where(eq(invitation.id, invited.invitationId));

      const firstResend = await resendInvitation(invited.invitationId, session, db, owner.headers);
      expect(firstResend.status).toBe("failed");

      const secondResend = await resendInvitation(invited.invitationId, session, db, owner.headers);
      expect(secondResend.status).toBe("rate_limited");
    });
  });

  it("refuses to resurrect a cancelled invitation through resend", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(
        db,
        "Owner",
        "resend-cancelled-owner@example.com",
        "Casa",
      );
      const session = await householdSessionFor(owner.headers);
      vi.spyOn(fakeEmailSender, "send").mockRejectedValueOnce(new Error("provider down"));

      const invited = await inviteMember(
        { email: "resend-cancelled-invitee@example.com", role: "member" },
        session,
        db,
        owner.headers,
      );
      expect(invited.status).toBe("ok");
      if (invited.status !== "ok") return;

      const cancelOutcome = await cancelInvitation(invited.invitationId, session, owner.headers);
      expect(cancelOutcome.status).toBe("ok");

      const resendOutcome = await resendInvitation(
        invited.invitationId,
        session,
        db,
        owner.headers,
      );
      expect(resendOutcome.status).toBe("not_found");

      const [row] = await db
        .select({ status: invitation.status })
        .from(invitation)
        .where(eq(invitation.id, invited.invitationId));
      expect(row?.status).toBe("canceled");
    });
  });
});
