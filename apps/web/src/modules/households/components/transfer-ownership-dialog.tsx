"use client";

import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initialActionState } from "@/lib/action-state";

import { transferOwnershipAction } from "../actions";
import { t } from "../strings";

export function TransferOwnershipDialog({
  memberId,
  memberName,
  open,
  onOpenChange,
}: {
  memberId: string;
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    transferOwnershipAction,
    initialActionState,
  );

  // revalidatePath (called from transferOwnershipAction on success) replaces
  // this dialog's own subtree with a freshly mounted instance as part of the
  // same update, so a success message written into this component's state
  // never has a chance to paint — closing immediately, before that remount,
  // is what a user actually sees, and the members table's updated roles are
  // the real confirmation.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.status === "success") {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="memberId" value={memberId} />
          <DialogHeader>
            <DialogTitle>{t.casa.transferDialog.title.replace("{name}", memberName)}</DialogTitle>
            <DialogDescription>
              {t.casa.transferDialog.description.replace("{name}", memberName)}
            </DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              {t.casa.transferDialog.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.casa.transferDialog.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
