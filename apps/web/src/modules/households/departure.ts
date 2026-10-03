import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { pickSuccessor, type SuccessionCandidate } from "@feudo/core";

import type { CurrentSession } from "@/modules/auth";
import { member, organization, user } from "@/modules/auth/schema";

import type { Database, DatabaseOrTransaction } from "@/platform/db/client";
import type { HouseholdRole } from "./membership";
import { householdIsNotPendingDeletion } from "./household-deletion";
import { householdSettings } from "./schema";
import { DEFAULT_TIME_ZONE } from "./validation";

type CandidateRow = { memberId: string; role: string; joinedAt: Date; leaving: boolean };

function asCandidate<T extends CandidateRow>(row: T): SuccessionCandidate & { row: T } {
  return {
    id: row.memberId,
    role: row.role === "admin" ? "admin" : "member",
    joinedAt: row.joinedAt,
    leaving: row.leaving,
    row,
  };
}

function groupByHousehold<T extends { householdId: string }>(rows: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    groups.set(row.householdId, [...(groups.get(row.householdId) ?? []), row]);
  }
  return groups;
}

export type MembershipDeparture = {
  householdId: string;
  householdName: string;
  timeZone: string;
  role: HouseholdRole;
  deletesHousehold: boolean;
  alreadyPendingDeletion: boolean;
  successorName: string | null;
  otherMembers: { name: string; email: string }[];
};

// What deleting the session's user would do to each household they belong
// to (ADR-0001, ADR-0008): who inherits ownership, which households go with
// them, and who else must be told. A household already pending deletion is
// hidden from its members and going regardless; it shows up only for its
// owner, the one person who could still restore it, because it is erased
// with them rather than handed to a successor.
export async function planMembershipDepartures(
  session: CurrentSession,
  db: Database,
): Promise<MembershipDeparture[]> {
  const households = db
    .select({ id: member.organizationId })
    .from(member)
    .where(eq(member.userId, session.userId));
  const rows = await db
    .select({
      memberId: member.id,
      householdId: member.organizationId,
      householdName: organization.name,
      userId: member.userId,
      name: user.name,
      email: user.email,
      role: member.role,
      joinedAt: member.createdAt,
      deletionRequestedAt: user.deletionRequestedAt,
      householdDeletionRequestedAt: organization.deletionRequestedAt,
      timeZone: householdSettings.timeZone,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .innerJoin(user, eq(user.id, member.userId))
    .leftJoin(householdSettings, eq(householdSettings.householdId, member.organizationId))
    .where(inArray(member.organizationId, households))
    .orderBy(asc(organization.name), asc(member.createdAt));

  const departures: MembershipDeparture[] = [];
  for (const group of groupByHousehold(
    rows.map((row) => ({ ...row, leaving: row.deletionRequestedAt !== null })),
  ).values()) {
    const own = group.find((row) => row.userId === session.userId);
    if (!own) {
      continue;
    }
    const role = own.role as HouseholdRole;
    const base = {
      householdId: own.householdId,
      householdName: own.householdName,
      timeZone: own.timeZone ?? DEFAULT_TIME_ZONE,
      role,
    };
    if (own.householdDeletionRequestedAt !== null) {
      if (role === "owner") {
        departures.push({
          ...base,
          deletesHousehold: true,
          alreadyPendingDeletion: true,
          successorName: null,
          otherMembers: [],
        });
      }
      continue;
    }
    const others = group.filter((row) => row.userId !== session.userId);
    const successor = role === "owner" ? pickSuccessor(others.map(asCandidate)) : null;
    departures.push({
      ...base,
      deletesHousehold: others.length === 0,
      alreadyPendingDeletion: false,
      successorName: successor?.row.name ?? null,
      otherMembers: others.map((row) => ({ name: row.name, email: row.email })),
    });
  }
  return departures;
}

// Runs inside the account purge's own transaction, before the user row is
// deleted (ADR-0001): member_single_owner_trigger is checked at commit, so the
// owner's row goes first and the successor is promoted after it. A household
// left with nobody is deleted outright, and so is one the user owns that is
// already pending deletion: nobody else could restore it, so no successor
// inherits a household on its way out. Every member row of every
// household the user is in is locked first, in one fixed order, so a
// transfer, leave or removal racing the purge waits for it.
export async function releaseMembershipsForAccountPurge(
  tx: DatabaseOrTransaction,
  userId: string,
): Promise<void> {
  const households = tx
    .select({ id: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId));
  const rows = await tx
    .select({
      memberId: member.id,
      householdId: member.organizationId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.createdAt,
      deletionRequestedAt: user.deletionRequestedAt,
      householdDeletionRequestedAt: organization.deletionRequestedAt,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(inArray(member.organizationId, households))
    .orderBy(asc(member.organizationId), asc(member.id))
    .for("update", { of: member });

  for (const [householdId, group] of groupByHousehold(
    rows.map((row) => ({ ...row, leaving: row.deletionRequestedAt !== null })),
  )) {
    const own = group.find((row) => row.userId === userId);
    if (!own) {
      continue;
    }
    const others = group.filter((row) => row.userId !== userId);
    const ownsPendingHousehold = own.role === "owner" && own.householdDeletionRequestedAt !== null;
    if (others.length === 0 || ownsPendingHousehold) {
      await tx.delete(organization).where(eq(organization.id, householdId));
      continue;
    }
    await tx.delete(member).where(eq(member.id, own.memberId));
    if (own.role !== "owner") {
      continue;
    }
    const successor = pickSuccessor(others.map(asCandidate));
    if (successor) {
      await tx
        .update(member)
        .set({ role: "owner" })
        .where(and(eq(member.id, successor.id), ne(member.userId, userId)));
    }
  }
}

// The time zone a departing user's own dates are shown in, the same on every
// screen and email whether or not a household is active (ADR-0008): their
// oldest household's, else the default.
export async function timeZoneForDepartingUser(db: Database, userId: string): Promise<string> {
  const [row] = await db
    .select({ timeZone: householdSettings.timeZone })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .innerJoin(householdSettings, eq(householdSettings.householdId, member.organizationId))
    .where(and(eq(member.userId, userId), householdIsNotPendingDeletion()))
    .orderBy(asc(member.createdAt))
    .limit(1);
  return row?.timeZone ?? DEFAULT_TIME_ZONE;
}
