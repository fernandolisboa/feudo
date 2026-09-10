import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

const currentHeaders = vi.hoisted(() => ({ value: new Headers() }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(currentHeaders.value),
}));

import { withTestDb } from "@/db/test/harness";
import { invitation, member, organization, session as sessionTable } from "@/db/schema";
import { getAuth, getCurrentSession, type CurrentSession } from "@/modules/auth";
import { findLastFakeSentEmail } from "@/modules/auth/email/fake-email-repository";
import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";

import type { Database } from "@/db/client";
import {
  acceptInvitation,
  cancelInvitation,
  inviteMember,
  leaveHousehold,
  listMembers,
  listMyPendingInvitations,
  listPendingInvitations,
  removeMember,
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
    .where(eq(member.organizationId, householdId));
  if (!row) {
    throw new Error("owner member row not found in test setup");
  }
  return row.id;
}

describe("inviteMember (integration)", () => {
  it("sends an invitation email and creates a pending invite", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "invite-owner@example.com", "Casa");
      const session = await householdSessionFor(owner.headers);

      const outcome = await inviteMember(
        { email: "friend@example.com", role: "member" },
        session,
        owner.headers,
      );
      expect(outcome.status).toBe("ok");

      const sent = await findLastFakeSentEmail(db, "friend@example.com");
      expect(sent).toBeDefined();
      expect(sent?.text).toContain("Casa");

      const invites = await listPendingInvitations(session, owner.headers);
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
        owner.headers,
      );
      expect(outcome.status).toBe("already_a_member");
    });
  });

  it("refuses a second invite to the same pending email", async () => {
    await withTestDb(async (db) => {
      const owner = await createOwnerWithHousehold(db, "Owner", "dup-invite@example.com", "Casa");
      const session = await householdSessionFor(owner.headers);

      await inviteMember({ email: "dup@example.com", role: "member" }, session, owner.headers);
      const second = await inviteMember(
        { email: "dup@example.com", role: "member" },
        session,
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
