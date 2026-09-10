"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { acceptInvitationAction } from "../actions";
import { t } from "../strings";

export function AcceptInvitationButton({ invitationId }: { invitationId: string }) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.acceptInvitationFailed);

  function handleAccept() {
    run(() => acceptInvitationAction(invitationId));
  }

  return (
    <div className="flex flex-col gap-3">
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="button" onClick={handleAccept} disabled={isPending}>
        {t.inviteAcceptPage.accept}
      </Button>
    </div>
  );
}
