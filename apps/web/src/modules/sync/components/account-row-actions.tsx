"use client";

import { useActionState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { initialActionState } from "@/lib/action-state";

import { relabelAccountAction } from "../actions";
import type { AccountLabel } from "../repository";
import { t } from "../strings";

export function AccountRowActions({
  accountId,
  accountName,
  label,
}: {
  accountId: string;
  accountName: string;
  label: AccountLabel;
}) {
  const [state, formAction, isPending] = useActionState(relabelAccountAction, initialActionState);
  const nextLabel: AccountLabel = label === "shared" ? "individual" : "shared";

  function relabel() {
    const formData = new FormData();
    formData.set("accountId", accountId);
    formData.set("label", nextLabel);
    formAction(formData);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${t.accounts.table.actions}: ${accountName}`}
              disabled={isPending}
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={isPending} onClick={relabel}>
            {nextLabel === "shared"
              ? t.accounts.rowActions.markShared
              : t.accounts.rowActions.markIndividual}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {state.status === "error" ? (
        <span className="text-destructive text-xs">{state.message}</span>
      ) : null}
    </div>
  );
}
