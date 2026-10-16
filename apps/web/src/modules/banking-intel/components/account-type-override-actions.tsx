"use client";

import type { AccountType } from "@feudo/core";

import { Button } from "@/ui/button";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { resolveAccountTypeOverrideAction } from "../actions";
import { t } from "../strings";

// With a newer reference review the household chooses between the two
// versions, weighted equally because either can be the right one; without
// one, the only thing to do is undo its correction. Mirrors OverrideActions
// for a criterion correction.
export function AccountTypeOverrideActions({
  institutionId,
  accountType,
  seenReviewedAt,
  outdated,
}: {
  institutionId: string;
  accountType: AccountType;
  seenReviewedAt: string;
  outdated: boolean;
}) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.failed);
  const decide = (decision: "useReference" | "keepOwn") => {
    run(() =>
      resolveAccountTypeOverrideAction(institutionId, accountType, decision, seenReviewedAt),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {outdated ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                decide("useReference");
              }}
            >
              {t.detail.useReference}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                decide("keepOwn");
              }}
            >
              {t.detail.keepOwn}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              decide("useReference");
            }}
          >
            {t.accountTypes.undo}
          </Button>
        )}
      </div>
      {errorMessage ? (
        <p role="alert" className="text-destructive text-[13px]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
