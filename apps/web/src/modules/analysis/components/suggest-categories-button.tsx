"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/ui/button";
import { initialActionState } from "@/lib/action-state";
import { interpolateAll } from "@/lib/interpolate";

import { requestCategorySuggestionsAction } from "../actions";
import {
  CATEGORY_SUGGESTION_MAX_GROUPS,
  type SuggestCategoriesButtonProps,
} from "../category-suggestions";
import { t } from "../strings";

function pendingText(pendingCount: number): string {
  return pendingCount === 1
    ? t.categorySuggestions.pendingOne
    : interpolateAll(t.categorySuggestions.pendingMany, { count: String(pendingCount) });
}

function quotaText(remaining: number, limit: number): string {
  return interpolateAll(t.categorySuggestions.remaining, {
    remaining: String(remaining),
    limit: String(limit),
  });
}

export function SuggestCategoriesButton({
  pendingCount,
  remaining,
  limit,
}: SuggestCategoriesButtonProps) {
  const [state, formAction, isPending] = useActionState(
    requestCategorySuggestionsAction,
    initialActionState,
  );

  return (
    <div className="flex flex-col gap-1.5 border-b pb-4">
      <p className="text-sm">{pendingText(pendingCount)}</p>
      <p className="text-muted-foreground text-xs">
        {interpolateAll(t.categorySuggestions.disclosure, {
          limit: String(CATEGORY_SUGGESTION_MAX_GROUPS),
        })}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-[13px]">{quotaText(remaining, limit)}</p>
        <form action={formAction}>
          <Button type="submit" variant="outline" disabled={isPending || remaining === 0}>
            <Sparkles
              aria-hidden
              className={isPending ? "size-4 animate-pulse motion-reduce:animate-none" : "size-4"}
            />
            {isPending ? t.categorySuggestions.pending : t.categorySuggestions.button}
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
