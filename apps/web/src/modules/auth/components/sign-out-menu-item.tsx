"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
// Direct file imports, not the auth module's index: this file is bundled for
// the client, and the auth index also re-exports getCurrentSession, which
// reaches "next/headers". signOutAction is itself a "use server" export,
// safe to import directly either way.
import { signOutAction } from "../actions";
import { t } from "../strings";

function isRedirectSignal(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export function SignOutMenuItem() {
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await signOutAction();
        if (result.status === "error") {
          setFailed(true);
        }
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
      <DropdownMenuItem
        variant="destructive"
        onClick={handleSignOut}
        disabled={isPending}
        closeOnClick={false}
      >
        <LogOut className="size-4" />
        {t.userMenu.signOut}
      </DropdownMenuItem>
      {failed ? (
        <p role="alert" className="text-destructive px-1.5 py-1 text-xs">
          {t.errors.signOutFailed}
        </p>
      ) : null}
    </>
  );
}
