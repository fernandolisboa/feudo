import { formatShortDateTime } from "@/lib/format-date";
import { interpolate } from "@/lib/interpolate";

import type { ConnectionSummary, OwnedAccount, OwnHousehold } from "../repository";
import { AddConnectionDialog } from "./add-connection-dialog";
import { DeleteConnectionDialog } from "./delete-connection-dialog";
import { MoveAccountDialog } from "./move-account-dialog";
import { RemoveCredentialsDialog } from "./remove-credentials-dialog";
import { RenameConnectionDialog } from "./rename-connection-dialog";
import { t } from "../strings";

export function ConnectionsPanel({
  connections,
  ownedAccounts,
  ownHouseholds,
  hasCredentials,
  credentialsSavedAt,
  timeZone,
}: {
  connections: ConnectionSummary[];
  ownedAccounts: OwnedAccount[];
  ownHouseholds: OwnHousehold[];
  hasCredentials: boolean;
  credentialsSavedAt: Date | null;
  timeZone: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{t.connections.intro}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          {hasCredentials && credentialsSavedAt
            ? interpolate(
                t.connections.credentialsSaved,
                "{date}",
                formatShortDateTime(credentialsSavedAt, timeZone),
              )
            : t.connections.noCredentials}
        </p>
        {hasCredentials ? (
          <div className="flex items-center gap-2">
            <AddConnectionDialog />
            <RemoveCredentialsDialog />
          </div>
        ) : null}
      </div>
      {!hasCredentials && connections.length > 0 ? (
        <p className="text-destructive text-sm">{t.connections.syncStopped}</p>
      ) : null}
      {connections.length === 0 ? (
        <p className="font-heading text-sm">{t.connections.empty}</p>
      ) : (
        <ul className="divide-border flex flex-col divide-y">
          {connections.map((connection) => (
            <li
              key={connection.id}
              className="flex min-h-[var(--density-row)] flex-wrap items-center justify-between gap-2 py-2"
            >
              <div className="flex flex-col">
                <span className="font-medium">{connection.institutionName}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {interpolate(
                    t.connections.accountsCount,
                    "{count}",
                    String(connection.accountsCount),
                  )}
                  {" · "}
                  {connection.lastSyncedAt
                    ? interpolate(
                        t.connections.syncedAt,
                        "{date}",
                        formatShortDateTime(connection.lastSyncedAt, timeZone),
                      )
                    : t.connections.neverSynced}
                </span>
                {connection.lastSyncError ? (
                  <span className="text-destructive text-xs">{t.accounts.syncFailed}</span>
                ) : null}
                <ConnectionAccounts
                  accounts={ownedAccounts.filter(
                    (account) => account.connectionId === connection.id,
                  )}
                  ownHouseholds={ownHouseholds}
                />
              </div>
              <div className="flex items-center gap-1">
                <RenameConnectionDialog
                  connectionId={connection.id}
                  institutionName={connection.institutionName}
                />
                <DeleteConnectionDialog
                  connectionId={connection.id}
                  institutionName={connection.institutionName}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConnectionAccounts({
  accounts,
  ownHouseholds,
}: {
  accounts: OwnedAccount[];
  ownHouseholds: OwnHousehold[];
}) {
  if (accounts.length === 0) {
    return null;
  }
  return (
    <ul className="mt-1 flex flex-col">
      {accounts.map((account) => {
        const destinations = ownHouseholds.filter(
          (household) => household.id !== account.householdId,
        );
        return (
          <li key={account.id} className="flex flex-wrap items-center gap-x-2 text-xs">
            <span>{account.name}</span>
            {account.householdName ? (
              <span className="text-muted-foreground">
                {interpolate(
                  t.connections.accountInHousehold,
                  "{household}",
                  account.householdName,
                )}
              </span>
            ) : (
              <span className="text-warning">{t.connections.accountUnassigned}</span>
            )}
            {destinations.length > 0 ? (
              <MoveAccountDialog
                accountId={account.id}
                accountName={account.name}
                destinations={destinations}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
