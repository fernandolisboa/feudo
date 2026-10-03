import { beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

const currentHeaders = vi.hoisted(() => ({ value: new Headers() }));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(currentHeaders.value),
}));

import { getAuth, getCurrentSession } from "@/modules/auth";
import {
  invitation as invitationTable,
  member,
  organization,
  session as sessionTable,
  user,
} from "@/modules/auth/schema";
import { signUpVerifiedUser } from "@/modules/auth/test/sign-up-verified-user";
import { bankAccount, bankConnection } from "@/modules/sync/schema";
import { seedSyncedConnection } from "@/modules/sync/test/seed-synced-connection";
import { joinHousehold, withTwoUsers, type SeededUser } from "@/modules/sync/test/with-two-users";
import { withTestDb } from "@/platform/db/test/harness";

import type { Database } from "@/platform/db/client";
import { planMembershipDepartures } from "./departure";
import {
  listOwnedHouseholdsPendingDeletion,
  purgeHouseholdsDueForDeletion,
  requestHouseholdDeletion,
  restoreHousehold,
} from "./household-deletion";
import { lockMembershipScope } from "./membership-scope";
import { createHousehold, listHouseholds } from "./service";

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-integration-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.EMAIL_PROVIDER = "fake";

const REQUESTED_AT = new Date("2026-10-03T12:00:00.000Z");
const GRACE_END = new Date("2026-10-10T12:00:00.000Z");

beforeEach(() => {
  process.env.REGISTRATION_MODE = "open";
  currentHeaders.value = new Headers();
});

async function seedInvitation(db: Database, householdId: string, inviterId: string) {
  const id = crypto.randomUUID();
  await db.insert(invitationTable).values({
    id,
    organizationId: householdId,
    email: `${id}@example.com`,
    role: "member",
    status: "pending",
    expiresAt: new Date(Date.now() + 86_400_000),
    inviterId,
  });
  return id;
}

async function openSession(db: Database, owner: SeededUser, activeHouseholdId: string) {
  const id = crypto.randomUUID();
  await db.insert(sessionTable).values({
    id,
    token: id,
    userId: owner.id,
    expiresAt: new Date(Date.now() + 86_400_000),
    updatedAt: new Date(),
    activeOrganizationId: activeHouseholdId,
  });
  return id;
}

describe("household deletion (integration)", () => {
  it("hides the household from every member, cancels its invites and clears it as anyone's active household", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await joinHousehold(db, userB.id, householdA, "admin");
      const inviteA = await seedInvitation(db, householdA, userA.id);
      const inviteB = await seedInvitation(db, householdB, userB.id);
      const sessionOnA = await openSession(db, userB, householdA);

      expect(await requestHouseholdDeletion(userA.session, db, REQUESTED_AT)).toEqual({
        status: "ok",
      });

      const [row] = await db.select().from(organization).where(eq(organization.id, householdA));
      expect(row?.deletionRequestedAt).toEqual(REQUESTED_AT);
      expect(await lockMembershipScope(db, userA.id, householdA)).toBeNull();
      expect(await lockMembershipScope(db, userB.id, householdA)).toBeNull();
      expect(await lockMembershipScope(db, userB.id, householdB)).toEqual({
        householdId: householdB,
      });
      const invitations = await db.select({ id: invitationTable.id }).from(invitationTable);
      expect(invitations.map((invitation) => invitation.id)).toEqual([inviteB]);
      expect(inviteA).not.toBe(inviteB);
      const [session] = await db
        .select({ active: sessionTable.activeOrganizationId })
        .from(sessionTable)
        .where(eq(sessionTable.id, sessionOnA));
      expect(session?.active).toBeNull();
    });
  });

  it("refuses anyone but the owner and changes nothing", async () => {
    await withTwoUsers(async ({ db, userB, householdA }) => {
      await joinHousehold(db, userB.id, householdA, "admin");

      expect(
        await requestHouseholdDeletion(
          { ...userB.session, householdId: householdA },
          db,
          REQUESTED_AT,
        ),
      ).toEqual({ status: "not_allowed" });

      const [row] = await db.select().from(organization).where(eq(organization.id, householdA));
      expect(row?.deletionRequestedAt).toBeNull();
    });
  });

  it("shows a pending household only to its owner, who alone can restore it", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await joinHousehold(db, userB.id, householdA, "admin");
      await requestHouseholdDeletion(userA.session, db, REQUESTED_AT);

      expect(await listOwnedHouseholdsPendingDeletion(userA.session, db)).toEqual([
        {
          id: householdA,
          name: "Household A",
          purgeAt: GRACE_END,
          timeZone: "America/Sao_Paulo",
        },
      ]);
      expect(await listOwnedHouseholdsPendingDeletion(userB.session, db)).toEqual([]);

      expect(await restoreHousehold(householdA, userB.session, db)).toEqual({
        status: "not_found",
      });
      expect(await restoreHousehold(householdB, userA.session, db)).toEqual({
        status: "not_found",
      });
      expect(await restoreHousehold(householdA, userA.session, db)).toEqual({ status: "ok" });

      const [row] = await db.select().from(organization).where(eq(organization.id, householdA));
      expect(row?.deletionRequestedAt).toBeNull();
      expect(await lockMembershipScope(db, userB.id, householdA)).toEqual({
        householdId: householdA,
      });
    });
  });

  it("erases the household once the grace ends, leaving bank connections with their users and their accounts unassigned", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await joinHousehold(db, userB.id, householdA, "member");
      const connectionB = await seedSyncedConnection(db, userB, {
        household: { householdId: householdA },
        itemId: "item-b",
      });
      await requestHouseholdDeletion(userA.session, db, REQUESTED_AT);

      expect(await purgeHouseholdsDueForDeletion(db, new Date(GRACE_END.getTime() - 1))).toBe(0);
      expect(await purgeHouseholdsDueForDeletion(db, GRACE_END)).toBe(1);

      expect(await db.select().from(organization).where(eq(organization.id, householdA))).toEqual(
        [],
      );
      expect(await db.select().from(member).where(eq(member.organizationId, householdA))).toEqual(
        [],
      );
      expect(
        await db
          .select({ id: bankConnection.id })
          .from(bankConnection)
          .where(eq(bankConnection.id, connectionB.connectionId)),
      ).toHaveLength(1);
      expect(
        await db
          .select({ householdId: bankAccount.householdId })
          .from(bankAccount)
          .where(eq(bankAccount.connectionId, connectionB.connectionId)),
      ).toEqual([{ householdId: null }]);
      expect(
        await db.select().from(organization).where(eq(organization.id, householdB)),
      ).toHaveLength(1);
      expect(await db.select().from(user)).toHaveLength(2);
    });
  });

  it("leaves a household already pending deletion out of an account deletion's warnings", async () => {
    await withTwoUsers(async ({ db, userA, userB, householdA, householdB }) => {
      await joinHousehold(db, userA.id, householdB, "member");
      await requestHouseholdDeletion(userB.session, db, REQUESTED_AT);

      const departures = await planMembershipDepartures(userA.session, db);

      expect(departures.map((departure) => departure.householdId)).toEqual([householdA]);
    });
  });
});

describe("household deletion through Better Auth sessions (integration)", () => {
  it("falls back to no household for the owner, drops it from the switcher, refuses invites to it and brings it back on restore", async () => {
    await withTestDb(async (db) => {
      const headers = await signUpVerifiedUser(db, {
        name: "Dona",
        email: "dona@example.com",
        password: "correct-horse",
      });
      currentHeaders.value = headers;
      const created = await createHousehold(
        { name: "Casa", timeZone: "America/Sao_Paulo", reserveMultiple: 6 },
        await getCurrentSession(),
        db,
        headers,
      );
      if (created.status !== "ok") {
        throw new Error(`household not created: ${created.status}`);
      }
      const session = await getCurrentSession();
      if (!session?.householdId) {
        throw new Error("no active household");
      }

      await requestHouseholdDeletion(
        { ...session, householdId: session.householdId },
        db,
        new Date(),
      );

      expect((await getCurrentSession())?.householdId).toBeNull();
      expect(await listHouseholds(headers)).toEqual([]);
      await expect(
        getAuth().api.createInvitation({
          headers,
          body: { email: "nova@example.com", role: "member", organizationId: created.householdId },
        }),
      ).rejects.toThrow("household_deletion_pending");

      const inviteeHeaders = await signUpVerifiedUser(db, {
        name: "Convidada",
        email: "convidada@example.com",
        password: "correct-horse",
      });
      const [dona] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, "dona@example.com"));
      const invitationId = crypto.randomUUID();
      await db.insert(invitationTable).values({
        id: invitationId,
        organizationId: created.householdId,
        email: "convidada@example.com",
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() + 86_400_000),
        inviterId: dona?.id ?? "",
      });
      await expect(
        getAuth().api.acceptInvitation({ headers: inviteeHeaders, body: { invitationId } }),
      ).rejects.toThrow("household_deletion_pending");
      expect(
        await db
          .select()
          .from(member)
          .where(and(eq(member.organizationId, created.householdId), eq(member.role, "member"))),
      ).toEqual([]);

      expect(await restoreHousehold(created.householdId, session, db)).toEqual({ status: "ok" });
      expect((await getCurrentSession())?.householdId).toBe(created.householdId);
      expect((await listHouseholds(headers)).map((household) => household.id)).toEqual([
        created.householdId,
      ]);
    });
  });
});
