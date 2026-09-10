"use client";

import { useState, useTransition } from "react";

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
import { isRedirectSignal } from "@/lib/is-redirect-signal";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await leaveHouseholdAction();
        if (result.status === "error") {
          setErrorMessage(result.message);
        }
      } catch (error) {
        if (isRedirectSignal(error)) {
          throw error;
        }
        setErrorMessage(t.errors.leaveFailed);
      }
    });
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
