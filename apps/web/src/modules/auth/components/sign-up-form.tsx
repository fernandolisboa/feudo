"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { signUpAction } from "../actions";
import { t } from "../strings";

export function SignUpForm({ next }: { next?: string | null } = {}) {
  const [state, formAction, isPending] = useActionState(signUpAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t.signUp.nameLabel}</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t.signUp.emailLabel}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t.signUp.passwordLabel}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="termsAccepted" name="termsAccepted" className="mt-0.5" />
        <Label htmlFor="termsAccepted" className="text-sm leading-normal font-normal">
          {t.signUp.termsLabel}
        </Label>
      </div>

      <Button type="submit" disabled={isPending}>
        {t.signUp.submit}
      </Button>

      <p className="text-muted-foreground text-sm">
        {t.signUp.alreadyHaveAccount}{" "}
        <Link
          href="/entrar"
          className="text-brand hover:text-brand-hover underline underline-offset-4"
        >
          {t.signUp.signInLink}
        </Link>
      </p>
    </form>
  );
}
