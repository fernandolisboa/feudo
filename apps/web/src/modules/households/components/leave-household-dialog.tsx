"use client";

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
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { leaveHouseholdAction } from "../actions";
import { t } from "../strings";

export function LeaveHouseholdDialog({
  open,
  onOpenChange,
  isLastMember,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLastMember: boolean;
}) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.leaveFailed);

  function handleConfirm() {
    run(() => leaveHouseholdAction());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.casa.leaveDialog.title}</DialogTitle>
          <DialogDescription>
            {isLastMember
              ? t.casa.leaveDialog.lastMemberDescription
              : t.casa.leaveDialog.description}
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
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
            {t.casa.leaveDialog.cancel}
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleConfirm}>
            {t.casa.leaveDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
