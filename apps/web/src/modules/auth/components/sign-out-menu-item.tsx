"use client";

import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useActionInTransition } from "@/lib/use-action-in-transition";
// Direct file import, not the auth module's index: this file is bundled for
// the client, and the auth index also re-exports getCurrentSession, which
// reaches "next/headers". signOutAction is itself a "use server" export,
// safe to import directly either way.
import { signOutAction } from "../actions";
import { t } from "../strings";

export function SignOutMenuItem() {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.signOutFailed);

  function handleSignOut() {
    run(() => signOutAction());
  }

  return (
    <>
      <DropdownMenuItem
        variant="destructive"
        onClick={handleSignOut}
        disabled={isPending}
        closeOnClick={false}
      >
        <LogOut className="size-4" />
        {t.userMenu.signOut}
      </DropdownMenuItem>
      {errorMessage ? (
        <p role="alert" className="text-destructive px-1.5 py-1 text-xs">
          {errorMessage}
        </p>
      ) : null}
    </>
  );
}
