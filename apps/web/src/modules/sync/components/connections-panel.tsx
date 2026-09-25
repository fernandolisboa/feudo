import { formatShortDateTime } from "@/lib/format-date";
import { interpolate } from "@/lib/interpolate";

import type { ConnectionSummary } from "../repository";
import { AddConnectionDialog } from "./add-connection-dialog";
import { DeleteConnectionDialog } from "./delete-connection-dialog";
import { RemoveCredentialsDialog } from "./remove-credentials-dialog";
import { RenameConnectionDialog } from "./rename-connection-dialog";
import { t } from "../strings";

export function ConnectionsPanel({
  connections,
  hasCredentials,
  credentialsSavedAt,
  timeZone,
}: {
  connections: ConnectionSummary[];
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
