"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/ui/button";
import { initialActionState } from "@/lib/action-state";
import { interpolateAll } from "@/lib/interpolate";

import { syncNowAction } from "../actions";
import { t } from "../strings";

function quotaText(remaining: number, limit: number): string {
  if (remaining === 0) {
    return interpolateAll(t.manualSync.exhausted, { limit: String(limit) });
  }
  const template = remaining === 1 ? t.manualSync.remainingOne : t.manualSync.remaining;
  return interpolateAll(template, { remaining: String(remaining), limit: String(limit) });
}

export function ManualSyncControl({
  remaining,
  limit,
  hasFailures,
}: {
  remaining: number;
  limit: number;
  hasFailures: boolean;
}) {
  const [state, formAction, isPending] = useActionState(syncNowAction, initialActionState);
  const idleLabel = hasFailures ? t.manualSync.retry : t.manualSync.action;

  return (
    <div className="mb-4 flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-[13px]">{quotaText(remaining, limit)}</p>
        <form action={formAction}>
          <Button type="submit" variant="outline" disabled={isPending || remaining === 0}>
            <RefreshCw
              aria-hidden
              className={isPending ? "size-4 animate-spin motion-reduce:animate-none" : "size-4"}
            />
            {isPending ? t.manualSync.pending : idleLabel}
          </Button>
        </form>
      </div>
      {state.status === "idle" ? null : (
        <p
          role="status"
          className={state.status === "error" ? "text-destructive text-[13px]" : "text-[13px]"}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
