"use client";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { interpolateAll } from "@/lib/interpolate";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { restoreHouseholdAction } from "../actions";
import { t } from "../strings";

export type PendingHouseholdDeletionItem = { id: string; name: string; purgeDate: string };

export function PendingHouseholdDeletions({
  households,
}: {
  households: PendingHouseholdDeletionItem[];
}) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.restoreHouseholdFailed);
  const copy = t.casa.pendingDeletion;

  if (households.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{copy.description}</p>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <ul className="divide-border flex flex-col divide-y">
        {households.map((household) => (
          <li
            key={household.id}
            className="flex min-h-[var(--density-row)] flex-wrap items-center justify-between gap-2 py-2"
          >
            <span className="text-sm">
              {interpolateAll(copy.item, { name: household.name, date: household.purgeDate })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                run(() => restoreHouseholdAction(household.id));
              }}
            >
              {copy.restore}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
