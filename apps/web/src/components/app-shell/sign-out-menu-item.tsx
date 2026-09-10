"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { isRedirectSignal } from "@/lib/is-redirect-signal";
// Direct file import, not the auth module's index: this file is bundled for
// the client, and the auth index also re-exports getCurrentSession, which
// reaches "next/headers". signOutAction is itself a "use server" export,
// safe to import directly either way.
import { signOutAction } from "@/modules/auth/actions";
import { t } from "@/modules/theme";

export function SignOutMenuItem() {
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    setFailed(false);
    startTransition(async () => {
      try {
        await signOutAction();
      } catch (error) {
        if (isRedirectSignal(error)) {
          throw error;
        }
        setFailed(true);
      }
    });
  }

  return (
    <>
      <DropdownMenuItem variant="destructive" onClick={handleSignOut} disabled={isPending}>
        <LogOut className="size-4" />
        {t.userMenu.signOut}
      </DropdownMenuItem>
      {failed ? (
        <p role="alert" className="text-destructive px-2 py-1.5 text-xs">
          {t.userMenu.signOutError}
        </p>
      ) : null}
    </>
  );
}
