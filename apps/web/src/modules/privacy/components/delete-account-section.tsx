"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { interpolate } from "@/lib/interpolate";
import { useActionInTransition } from "@/lib/use-action-in-transition";
import { clearOfflineCopies } from "@/platform/pwa/offline-copies";

import { requestAccountDeletionAction } from "../actions";
import type { DeleteAccountSectionProps } from "../page-props";
import { t } from "../strings";

export function DeleteAccountSection({
  restorableUntil,
  households,
  othersAreTold,
  compact = false,
}: DeleteAccountSectionProps & { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.requestFailed);
  const copy = t.deleteAccount;

  return (
    <div className="flex flex-col items-start gap-3">
      {compact ? null : (
        <p className="text-muted-foreground max-w-prose text-sm">{copy.description}</p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button type="button" variant={compact ? "link" : "destructive"} />}>
          {copy.action}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.dialog.title}</DialogTitle>
            <DialogDescription>
              {interpolate(copy.dialog.description, "{date}", restorableUntil)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium">{copy.dialog.households}</p>
            {households.length === 0 ? (
              <p className="text-muted-foreground">{copy.dialog.noHouseholds}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {households.map((household) => (
                  <li key={household.name} className="flex flex-col gap-0.5">
                    {household.lines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </li>
                ))}
              </ul>
            )}
            {othersAreTold ? (
              <p className="text-muted-foreground">{copy.household.membersTold}</p>
            ) : null}
          </div>

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
                setOpen(false);
              }}
            >
              {copy.dialog.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                run(async () => {
                  await clearOfflineCopies();
                  return requestAccountDeletionAction();
                });
              }}
            >
              {copy.dialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
