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

import { removeMemberAction } from "../actions";
import { t } from "../strings";

export function RemoveMemberDialog({
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
  const [state, formAction, isPending] = useActionState(removeMemberAction, initialActionState);

  // See TransferOwnershipDialog: revalidatePath remounts this dialog's own
  // subtree as part of a successful submit, so closing right away is what a
  // user actually sees — the members table losing the row is the real
  // confirmation, a success message here never gets the chance to paint.
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
            <DialogTitle>{t.casa.removeDialog.title.replace("{name}", memberName)}</DialogTitle>
            <DialogDescription>
              {t.casa.removeDialog.description.replace("{name}", memberName)}
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
              {t.casa.removeDialog.cancel}
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {t.casa.removeDialog.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
