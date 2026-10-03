import { deletionPurgeAt, deletionPurgeCutoff, type YearMonth } from "@feudo/core";

import {
  revokeUserSessions,
  type CurrentSession,
  type EmailSender,
  type PendingAccountDeletion,
} from "@/modules/auth";
import {
  planMembershipDepartures,
  releaseMembershipsForAccountPurge,
  type MembershipDeparture,
} from "@/modules/households";
import {
  deleteConnectionsForAccountPurge,
  describeHouseholdDataLoss,
  destroyProviderCredentials,
} from "@/modules/sync";

import { errorName } from "@/lib/error-name";
import { formatShortDate } from "@/lib/format-date";
import type { Outcome, SimpleOutcome } from "@/lib/outcome";
import type { Database } from "@/platform/db/client";
import { buildAccountDeletionRequestedEmail, buildMemberDepartureEmail } from "./email";
import {
  clearAccountDeletion,
  deleteUser,
  listAccountsDueForDeletion,
  lockAccountDueForDeletion,
  markAccountForDeletion,
} from "./repository";

export type AccountDeletionHousehold = MembershipDeparture & {
  accounts: number;
  months: YearMonth[];
};

// What the session's user is warned about before confirming (ADR-0008), and
// what the other members of each household are told once they do.
export async function previewAccountDeletion(
  session: CurrentSession,
  db: Database,
): Promise<AccountDeletionHousehold[]> {
  const [departures, losses] = await Promise.all([
    planMembershipDepartures(session, db),
    describeHouseholdDataLoss(db, session),
  ]);
  return departures.map((departure) => ({
    ...departure,
    ...(losses.get(departure.householdId) ?? { accounts: 0, months: [] }),
  }));
}

export type AccountDeletionDeps = {
  emailSender: EmailSender;
  now: Date;
  timeZone: string;
  cancelUrl: string;
};

export type RequestAccountDeletionOutcome = Outcome<
  { purgeAt: Date },
  "already_pending" | "failed"
>;

// The soft delete (ADR-0008): in one transaction the account is marked, the
// provider credentials are destroyed and every session is revoked, so from
// this commit on nothing reads the user's bank and nothing signs in as them
// except to cancel. The hard delete waits for the grace to end
// (runAccountPurgeStep).
export async function requestAccountDeletion(
  session: CurrentSession,
  db: Database,
  deps: AccountDeletionDeps,
): Promise<RequestAccountDeletionOutcome> {
  let households: AccountDeletionHousehold[];
  let marked: boolean;
  try {
    households = await previewAccountDeletion(session, db);
    marked = await db.transaction(async (tx) => {
      if (!(await markAccountForDeletion(tx, session, deps.now))) {
        return false;
      }
      await destroyProviderCredentials(tx, session);
      await revokeUserSessions(tx, session.userId);
      return true;
    });
  } catch {
    return { status: "failed" };
  }
  if (!marked) {
    return { status: "already_pending" };
  }

  const purgeAt = deletionPurgeAt(deps.now);
  await sendDeletionNotices(session, households, deps, formatShortDate(purgeAt, deps.timeZone));
  return { status: "ok", purgeAt };
}

// Best-effort, after the commit: a provider failure must not undo or block a
// deletion the user already confirmed, so each send is logged on its own.
async function sendDeletionNotices(
  session: CurrentSession,
  households: AccountDeletionHousehold[],
  deps: AccountDeletionDeps,
  purgeDate: string,
): Promise<void> {
  const sends = [
    {
      to: session.email,
      ...buildAccountDeletionRequestedEmail({ purgeDate, cancelUrl: deps.cancelUrl }),
    },
    ...households.flatMap((household) =>
      household.otherMembers.map((other) => ({
        to: other.email,
        ...buildMemberDepartureEmail({
          name: session.name,
          householdName: household.householdName,
          purgeDate,
          accounts: household.accounts,
          months: household.months,
          successorName: household.successorName,
        }),
      })),
    ),
  ];
  await Promise.all(
    sends.map((email) =>
      deps.emailSender.send(email).catch((error: unknown) => {
        console.error("account deletion email send failed", errorName(error));
      }),
    ),
  );
}

export type CancelAccountDeletionOutcome = SimpleOutcome<"ok" | "not_pending" | "failed">;

// Restores the account as it was, except for the provider credentials, which
// were destroyed when the deletion was asked for (ADR-0008).
export async function cancelAccountDeletion(
  pending: PendingAccountDeletion,
  db: Database,
): Promise<CancelAccountDeletionOutcome> {
  try {
    return { status: (await clearAccountDeletion(db, pending)) ? "ok" : "not_pending" };
  } catch {
    return { status: "failed" };
  }
}

// The hard delete, in one transaction per user (ADR-0001, ADR-0008):
// ownership passes on and households left empty go, then the user's
// connections (with their accounts and transactions), then the user row and
// everything that cascades from it.
export async function purgeAccount(
  db: Database,
  userId: string,
  now: Date,
): Promise<"purged" | "not_due"> {
  return db.transaction(async (tx) => {
    if (!(await lockAccountDueForDeletion(tx, userId, deletionPurgeCutoff(now)))) {
      return "not_due";
    }
    await releaseMembershipsForAccountPurge(tx, userId);
    await deleteConnectionsForAccountPurge(tx, userId);
    await deleteUser(tx, userId);
    return "purged";
  });
}

export type AccountPurgeStep =
  { ok: boolean; purged: number; failed: number; unreached: number } | { error: string };

export async function runAccountPurgeStep(
  db: Database,
  now: Date,
  deadline: Date,
): Promise<AccountPurgeStep> {
  try {
    const due = await listAccountsDueForDeletion(db, deletionPurgeCutoff(now));
    let purged = 0;
    let failed = 0;
    for (let index = 0; index < due.length; index += 1) {
      const userId = due[index];
      if (userId === undefined) {
        continue;
      }
      if (Date.now() >= deadline.getTime()) {
        return { ok: failed === 0, purged, failed, unreached: due.length - index };
      }
      try {
        if ((await purgeAccount(db, userId, now)) === "purged") {
          purged += 1;
        }
      } catch (error) {
        console.warn(`privacy: account purge failed for user ${userId} (${errorName(error)})`);
        failed += 1;
      }
    }
    return { ok: failed === 0, purged, failed, unreached: 0 };
  } catch (error) {
    return { error: errorName(error) };
  }
}
