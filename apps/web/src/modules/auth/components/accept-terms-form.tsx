"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { initialActionState } from "@/lib/action-state";
import { acceptTermsAction } from "../actions";
import { t } from "../strings";
import { TermsCheckbox } from "./terms-checkbox";

export function AcceptTermsForm() {
  const [state, formAction, isPending] = useActionState(acceptTermsAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <TermsCheckbox />
      <Button type="submit" disabled={isPending}>
        {t.acceptTerms.submit}
      </Button>
    </form>
  );
}
