"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { initialActionState } from "@/lib/action-state";
import { resendVerificationAction } from "../actions";
import { t } from "../strings";

export function ResendVerificationForm({ email, next }: { email: string; next?: string | null }) {
  const [state, formAction, isPending] = useActionState(
    resendVerificationAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="email" value={email} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {state.status === "success" ? (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" variant="outline" disabled={isPending}>
        {t.verifyEmail.resend}
      </Button>
    </form>
  );
}
