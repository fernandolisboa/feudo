"use client";

import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isRedirectSignal } from "@/lib/is-redirect-signal";

import { acceptInvitationAction } from "../actions";
import type { InvitationForUser } from "../membership";
import { t } from "../strings";

function InvitationRow({ invitation }: { invitation: InvitationForUser }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await acceptInvitationAction(invitation.id);
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
    <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
      <div>
        <p className="font-medium">{invitation.householdName}</p>
        <p className="text-muted-foreground text-sm">
          {t.invitesTab.invitedAs.replace("{role}", t.casa.roles[invitation.role])}
        </p>
      </div>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="button" onClick={handleAccept} disabled={isPending}>
        {t.invitesTab.accept}
      </Button>
    </div>
  );
}

export function OnboardingInvitesPanel({ invitations }: { invitations: InvitationForUser[] }) {
  if (invitations.length === 0) {
    return <p className="text-muted-foreground text-sm">{t.invitesTab.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {invitations.map((invitation) => (
        <InvitationRow key={invitation.id} invitation={invitation} />
      ))}
    </div>
  );
}
