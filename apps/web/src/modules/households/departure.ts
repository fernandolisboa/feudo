import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import { pickSuccessor, type SuccessionCandidate } from "@feudo/core";

import type { CurrentSession } from "@/modules/auth";
import { member, organization, user } from "@/modules/auth/schema";

import type { Database, DatabaseOrTransaction } from "@/platform/db/client";
import type { HouseholdRole } from "./membership";

type HouseholdMemberRow = {
  memberId: string;
  householdId: string;
  householdName: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: Date;
  leaving: boolean;
};

function asCandidate(row: HouseholdMemberRow): SuccessionCandidate & { row: HouseholdMemberRow } {
  return {
    id: row.memberId,
    role: row.role === "admin" ? "admin" : "member",
    joinedAt: row.joinedAt,
    leaving: row.leaving,
    row,
  };
}

function groupByHousehold(rows: HouseholdMemberRow[]): Map<string, HouseholdMemberRow[]> {
  const groups = new Map<string, HouseholdMemberRow[]>();
  for (const row of rows) {
    groups.set(row.householdId, [...(groups.get(row.householdId) ?? []), row]);
  }
  return groups;
}

export type MembershipDeparture = {
  householdId: string;
  householdName: string;
  role: HouseholdRole;
  deletesHousehold: boolean;
  successorName: string | null;
  otherMembers: { name: string; email: string }[];
};

// What deleting the session's user would do to each household they belong
// to (ADR-0001, ADR-0008): who inherits ownership, which households go with
// them, and who else must be told. A household already pending deletion is
// left out: it is going regardless.
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
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .innerJoin(user, eq(user.id, member.userId))
    .where(
      and(inArray(member.organizationId, households), isNull(organization.deletionRequestedAt)),
    )
    .orderBy(asc(organization.name), asc(member.createdAt));

  const departures: MembershipDeparture[] = [];
  for (const group of groupByHousehold(
    rows.map((row) => ({ ...row, leaving: row.deletionRequestedAt !== null })),
  ).values()) {
    const own = group.find((row) => row.userId === session.userId);
    if (!own) {
      continue;
    }
    const others = group.filter((row) => row.userId !== session.userId);
    const role = own.role as HouseholdRole;
    const successor = role === "owner" ? pickSuccessor(others.map(asCandidate)) : null;
    departures.push({
      householdId: own.householdId,
      householdName: own.householdName,
      role,
      deletesHousehold: others.length === 0,
      successorName: successor?.row.name ?? null,
      otherMembers: others.map((row) => ({ name: row.name, email: row.email })),
    });
  }
  return departures;
}

// Runs inside the account purge's own transaction, before the user row is
// deleted (ADR-0001): member_single_owner_trigger is checked at commit, so the
// owner's row goes first and the successor is promoted after it, and a
// household left with nobody is deleted outright. Every member row of every
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
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(inArray(member.organizationId, households))
    .orderBy(asc(member.organizationId), asc(member.id))
    .for("update", { of: member });

  for (const [householdId, group] of groupByHousehold(
    rows.map((row) => ({
      ...row,
      householdName: "",
      name: "",
      email: "",
      leaving: row.deletionRequestedAt !== null,
    })),
  )) {
    const own = group.find((row) => row.userId === userId);
    if (!own) {
      continue;
    }
    const others = group.filter((row) => row.userId !== userId);
    if (others.length === 0) {
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
