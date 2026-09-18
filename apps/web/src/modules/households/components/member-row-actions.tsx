"use client";

import { useActionState, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { initialActionState } from "@/lib/action-state";

import { updateMemberRoleAction } from "../actions";
import type { HouseholdMember } from "../membership";
import { LeaveHouseholdDialog } from "./leave-household-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";
import { t } from "../strings";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";

type DialogKind = "remove" | "leave" | "transfer" | null;

export function MemberRowActions({
  member,
  currentUserId,
  viewerRole,
  isLastMember,
}: {
  member: HouseholdMember;
  currentUserId: string;
  viewerRole: "owner" | "admin" | "member";
  isLastMember: boolean;
}) {
  const [openDialog, setOpenDialog] = useState<DialogKind>(null);
  const [roleState, roleFormAction, isRoleUpdatePending] = useActionState(
    updateMemberRoleAction,
    initialActionState,
  );

  const isSelf = member.userId === currentUserId;
  const isOwnerRow = member.role === "owner";
  const canManage = viewerRole === "owner" || viewerRole === "admin";

  const canToggleRole = canManage && !isOwnerRow && !isSelf;
  const canRemove = canManage && !isOwnerRow && !isSelf;
  // The owner can leave too, but only when they are also the household's
  // last member: leaving then deletes the household (households.
  // leaveHousehold) instead of requiring a transfer that has nobody left to
  // transfer to.
  const canLeave = isSelf && (!isOwnerRow || isLastMember);
  const canTransferTo = viewerRole === "owner" && !isSelf && !isOwnerRow;

  const hasAnyAction = canToggleRole || canRemove || canLeave || canTransferTo;

  function handleRoleToggle(nextRole: "admin" | "member") {
    const formData = new FormData();
    formData.set("memberId", member.id);
    formData.set("role", nextRole);
    roleFormAction(formData);
  }

  if (!hasAnyAction) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t.casa.table.actions}
              disabled={isRoleUpdatePending}
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canToggleRole && member.role === "member" ? (
            <DropdownMenuItem
              disabled={isRoleUpdatePending}
              onClick={() => {
                handleRoleToggle("admin");
              }}
            >
              {t.casa.rowActions.makeAdmin}
            </DropdownMenuItem>
          ) : null}
          {canToggleRole && member.role === "admin" ? (
            <DropdownMenuItem
              disabled={isRoleUpdatePending}
              onClick={() => {
                handleRoleToggle("member");
              }}
            >
              {t.casa.rowActions.makeMember}
            </DropdownMenuItem>
          ) : null}
          {canTransferTo ? (
            <DropdownMenuItem
              onClick={() => {
                setOpenDialog("transfer");
              }}
            >
              {t.casa.rowActions.transferTo.replace("{name}", member.name)}
            </DropdownMenuItem>
          ) : null}
          {canRemove ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setOpenDialog("remove");
              }}
            >
              {t.casa.rowActions.remove}
            </DropdownMenuItem>
          ) : null}
          {canLeave ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setOpenDialog("leave");
              }}
            >
              {t.casa.rowActions.leave}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {roleState.status === "error" ? (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{roleState.message}</AlertDescription>
        </Alert>
      ) : null}

      <RemoveMemberDialog
        memberId={member.id}
        memberName={member.name}
        open={openDialog === "remove"}
        onOpenChange={(open) => {
          setOpenDialog(open ? "remove" : null);
        }}
      />
      <TransferOwnershipDialog
        memberId={member.id}
        memberName={member.name}
        open={openDialog === "transfer"}
        onOpenChange={(open) => {
          setOpenDialog(open ? "transfer" : null);
        }}
      />
      <LeaveHouseholdDialog
        open={openDialog === "leave"}
        onOpenChange={(open) => {
          setOpenDialog(open ? "leave" : null);
        }}
        isLastMember={isLastMember}
      />
    </>
  );
}
