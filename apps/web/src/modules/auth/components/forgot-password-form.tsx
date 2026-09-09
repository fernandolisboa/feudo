"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { requestPasswordResetAction } from "../actions";
import { t } from "../strings";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t.forgotPassword.emailLabel}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <Button type="submit" disabled={isPending}>
        {t.forgotPassword.submit}
      </Button>

      <p className="text-muted-foreground text-sm">
        <Link
          href="/entrar"
          className="text-brand hover:text-brand-hover underline underline-offset-4"
        >
          {t.forgotPassword.backToSignIn}
        </Link>
      </p>
    </form>
  );
}
