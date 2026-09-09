"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
// Direct file imports, not the modules' indexes: this file is bundled for
// the client, and both index.ts files also re-export code that depends on
// "next/headers" (see the matching note in sidebar-nav.tsx). signOutAction
// itself is a "use server" export, safe to import directly either way.
import { signOutAction } from "@/modules/auth/actions";
import { t } from "@/modules/theme/strings";

export function SignOutMenuItem() {
  const [, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(() => {
      void signOutAction();
    });
  }

  return (
    <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
      <LogOut className="size-4" />
      {t.userMenu.signOut}
    </DropdownMenuItem>
  );
}
