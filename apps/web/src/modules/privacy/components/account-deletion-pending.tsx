"use client";

import Link from "next/link";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { cancelAccountDeletionAction, signOutFromPendingDeletionAction } from "../actions";
import { t } from "../strings";

export function AccountDeletionPending({ signedIn }: { signedIn: boolean }) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.cancelFailed);
  const copy = t.pending;

  if (!signedIn) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">{copy.signedOutBody}</p>
        <Button render={<Link href="/entrar" />}>{copy.signIn}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{copy.body}</p>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => {
            run(() => cancelAccountDeletionAction());
          }}
        >
          {copy.cancel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            run(() => signOutFromPendingDeletionAction());
          }}
        >
          {copy.signOut}
        </Button>
      </div>
    </div>
  );
}
