"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/ui/button";
import { initialActionState } from "@/lib/action-state";
import { interpolateAll } from "@/lib/interpolate";

import { requestAnalysisAction } from "../actions";
import { t } from "../strings";

function quotaText(remaining: number, limit: number, inProgress: boolean): string {
  if (inProgress) {
    return t.panel.inProgress;
  }
  if (remaining === 0) {
    return interpolateAll(t.panel.exhausted, { limit: String(limit) });
  }
  const template = remaining === 1 ? t.panel.remainingOne : t.panel.remaining;
  return interpolateAll(template, { remaining: String(remaining), limit: String(limit) });
}

export function RequestAnalysisControl({
  remaining,
  limit,
  inProgress,
}: {
  remaining: number;
  limit: number;
  inProgress: boolean;
}) {
  const [state, formAction, isPending] = useActionState(requestAnalysisAction, initialActionState);

  return (
    <div className="mt-6 flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-[13px]">
          {quotaText(remaining, limit, inProgress)}
        </p>
        <form action={formAction}>
          <Button
            type="submit"
            variant="outline"
            disabled={isPending || inProgress || remaining === 0}
          >
            <Sparkles
              aria-hidden
              className={isPending ? "size-4 animate-pulse motion-reduce:animate-none" : "size-4"}
            />
            {isPending ? t.panel.pending : t.panel.request}
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
