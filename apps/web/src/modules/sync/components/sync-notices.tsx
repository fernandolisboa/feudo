import { Notice } from "@/ui/notice";
import { interpolateAll } from "@/lib/interpolate";

import { describeFreshness } from "../freshness";
import type { HouseholdAccount } from "../repository";
import { parseSyncFailure } from "../sync-status";
import { t } from "../strings";

type FailedConnection = { id: string; institutionName: string; connectedByName: string };

function failedConnections(accounts: HouseholdAccount[]): (FailedConnection & { cause: string })[] {
  const byConnection = new Map<string, FailedConnection & { cause: string }>();
  for (const account of accounts) {
    const failure = parseSyncFailure(account.lastSyncError);
    if (failure === null || byConnection.has(account.connectionId)) {
      continue;
    }
    byConnection.set(account.connectionId, {
      id: account.connectionId,
      institutionName: account.institutionName,
      connectedByName: account.connectedByName,
      cause: t.syncNotices.causes[failure],
    });
  }
  return [...byConnection.values()];
}

export function SyncNotices({
  accounts,
  now,
  timeZone,
}: {
  accounts: HouseholdAccount[];
  now: Date;
  timeZone: string;
}) {
  const staleCount = accounts.filter(
    (account) => describeFreshness(account.syncedAt, now, timeZone).stale,
  ).length;
  const failures = failedConnections(accounts);

  return (
    <>
      {failures.map((connection) => (
        <Notice key={connection.id} tone="danger">
          {interpolateAll(t.syncNotices.failed, {
            institution: connection.institutionName,
            person: connection.connectedByName,
            cause: connection.cause,
          })}
        </Notice>
      ))}
      {staleCount > 0 ? (
        <Notice>
          {staleCount === 1
            ? t.syncNotices.staleOne
            : interpolateAll(t.syncNotices.staleMany, { count: String(staleCount) })}
        </Notice>
      ) : null}
    </>
  );
}
