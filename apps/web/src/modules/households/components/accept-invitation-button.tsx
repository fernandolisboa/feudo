"use client";

import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isRedirectSignal } from "@/lib/is-redirect-signal";

import { acceptInvitationAction } from "../actions";
import { t } from "../strings";

export function AcceptInvitationButton({ invitationId }: { invitationId: string }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await acceptInvitationAction(invitationId);
        if (result.status === "error") {
          setErrorMessage(result.message);
        }
      } catch (error) {
        if (isRedirectSignal(error)) {
          throw error;
        }
        setErrorMessage(t.errors.acceptInvitationFailed);
      }
    });
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
