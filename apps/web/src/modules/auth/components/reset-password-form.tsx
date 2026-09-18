"use client";

import { useActionState, useEffect } from "react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { initialActionState } from "@/lib/action-state";
import { resetPasswordAction } from "../actions";
import { t } from "../strings";

// The token starts in the URL (Better Auth's own GET /reset-password/:token
// callback redirects here with it as a query param) so a shared device, a
// browser history entry or a referrer header can still leak it; the form
// already captured it as a prop, so this only tidies the address bar the
// user sees, it never re-reads the token from `window.location`.
function useStripTokenFromUrl(): void {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("token")) {
      return;
    }
    url.searchParams.delete("token");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialActionState);
  useStripTokenFromUrl();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">{t.resetPassword.passwordLabel}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {t.resetPassword.submit}
      </Button>
    </form>
  );
}
