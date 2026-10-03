import { and, asc, eq, exists, inArray, isNotNull, isNull, lte, type SQL } from "drizzle-orm";
import { deletionPurgeAt, deletionPurgeCutoff } from "@feudo/core";

import type { CurrentSession } from "@/modules/auth";
import {
  invitation as invitationTable,
  member,
  organization,
  session as sessionTable,
} from "@/modules/auth/schema";

import { errorName } from "@/lib/error-name";
import type { SimpleOutcome } from "@/lib/outcome";
import type { Database, DatabaseOrTransaction } from "@/platform/db/client";
import type { HouseholdSession } from "./require-household-session";
import { householdSettings } from "./schema";
import { DEFAULT_TIME_ZONE } from "./validation";

// The one rule every households-wide read applies (ADR-0001, 2026-10-03): a
// household pending deletion is hidden from its members and skipped by every
// job. Only auth, which households builds on, spells it out on its own.
export function householdIsNotPendingDeletion(): SQL {
  return isNull(organization.deletionRequestedAt);
}

export type RequestHouseholdDeletionOutcome = SimpleOutcome<"ok" | "not_allowed" | "failed">;

class NotOwnerError extends Error {}

// ADR-0008: the owner deletes the household with a 7-day grace. From now on
// it is hidden from every member (auth's session resolution skips it), its
// pending invites are gone, and nothing else changes until the purge, so a
// restore brings it back exactly as it was. The owner check reads the member
// rows under the same lock transferOwnership takes, so a transfer racing
// this request is serialised behind it.
export async function requestHouseholdDeletion(
  session: HouseholdSession,
  db: Database,
  now: Date,
): Promise<RequestHouseholdDeletionOutcome> {
  try {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({ userId: member.userId, role: member.role })
        .from(member)
        .where(eq(member.organizationId, session.householdId))
        .for("update");
      const isOwner = rows.some((row) => row.userId === session.userId && row.role === "owner");
      if (!isOwner) {
        throw new NotOwnerError();
      }
      await tx
        .update(organization)
        .set({ deletionRequestedAt: now })
        .where(
          and(eq(organization.id, session.householdId), isNull(organization.deletionRequestedAt)),
        );
      await tx
        .delete(invitationTable)
        .where(
          and(
            eq(invitationTable.organizationId, session.householdId),
            eq(invitationTable.status, "pending"),
          ),
        );
      await tx
        .update(sessionTable)
        .set({ activeOrganizationId: null })
        .where(eq(sessionTable.activeOrganizationId, session.householdId));
    });
  } catch (error) {
    if (error instanceof NotOwnerError) {
      return { status: "not_allowed" };
    }
    return { status: "failed" };
  }
  return { status: "ok" };
}

export type HouseholdPendingDeletion = {
  id: string;
  name: string;
  purgeAt: Date;
  timeZone: string;
};

// Only the owner sees a household they asked to delete, and only here: it is
// the one way back to it before the purge.
export async function listOwnedHouseholdsPendingDeletion(
  session: CurrentSession,
  db: Database,
): Promise<HouseholdPendingDeletion[]> {
  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
      deletionRequestedAt: organization.deletionRequestedAt,
      timeZone: householdSettings.timeZone,
    })
    .from(organization)
    .innerJoin(member, eq(member.organizationId, organization.id))
    .leftJoin(householdSettings, eq(householdSettings.householdId, organization.id))
    .where(
      and(
        eq(member.userId, session.userId),
        eq(member.role, "owner"),
        isNotNull(organization.deletionRequestedAt),
      ),
    )
    .orderBy(asc(organization.deletionRequestedAt));
  return rows.flatMap((row) =>
    row.deletionRequestedAt
      ? [
          {
            id: row.id,
            name: row.name,
            purgeAt: deletionPurgeAt(row.deletionRequestedAt),
            timeZone: row.timeZone ?? DEFAULT_TIME_ZONE,
          },
        ]
      : [],
  );
}

export type RestoreHouseholdOutcome = SimpleOutcome<"ok" | "not_found" | "failed">;

// The household id comes from a form, so the owner check is part of the
// write itself: anyone who is not that household's owner, or a household not
// pending deletion, changes nothing and learns nothing (not_found either way).
export async function restoreHousehold(
  householdId: string,
  session: CurrentSession,
  db: Database,
): Promise<RestoreHouseholdOutcome> {
  try {
    const restored = await db
      .update(organization)
      .set({ deletionRequestedAt: null })
      .where(
        and(
          eq(organization.id, householdId),
          isNotNull(organization.deletionRequestedAt),
          exists(
            db
              .select({ id: member.id })
              .from(member)
              .where(
                and(
                  eq(member.organizationId, householdId),
                  eq(member.userId, session.userId),
                  eq(member.role, "owner"),
                ),
              ),
          ),
        ),
      )
      .returning({ id: organization.id });
    return { status: restored.length === 1 ? "ok" : "not_found" };
  } catch {
    return { status: "failed" };
  }
}

export async function filterHouseholdsPendingDeletion(
  db: DatabaseOrTransaction,
  householdIds: string[],
): Promise<Set<string>> {
  if (householdIds.length === 0) {
    return new Set();
  }
  const rows = await db
    .select({ id: organization.id })
    .from(organization)
    .where(
      and(inArray(organization.id, householdIds), isNotNull(organization.deletionRequestedAt)),
    );
  return new Set(rows.map((row) => row.id));
}

// Deleting the organization row is the hard delete ADR-0008 describes: every
// household-scoped table cascades with it, and every account assigned to it
// becomes unassigned (bank_account.household_id is set null, and
// member_departure_trigger does the same as each membership goes), so bank
// connections survive with their users.
export async function purgeHouseholdsDueForDeletion(db: Database, now: Date): Promise<number> {
  const deleted = await db
    .delete(organization)
    .where(lte(organization.deletionRequestedAt, deletionPurgeCutoff(now)))
    .returning({ id: organization.id });
  return deleted.length;
}

export type HouseholdPurgeStep = { purged: number } | { error: string };

export async function runHouseholdPurgeStep(db: Database, now: Date): Promise<HouseholdPurgeStep> {
  try {
    return { purged: await purgeHouseholdsDueForDeletion(db, now) };
  } catch (error) {
    return { error: errorName(error) };
  }
}
