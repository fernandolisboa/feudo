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

import { requestHouseholdDeletionAction } from "../actions";
import { t } from "../strings";

export function DeleteHouseholdSection({
  householdName,
  restorableUntil,
}: {
  householdName: string;
  restorableUntil: string;
}) {
  const [open, setOpen] = useState(false);
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.deleteHouseholdFailed);
  const copy = t.casa.deleteHousehold;

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground max-w-prose text-sm">{copy.description}</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button type="button" variant="destructive" />}>
          {copy.action}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{interpolate(copy.dialog.title, "{name}", householdName)}</DialogTitle>
            <DialogDescription>
              {interpolate(copy.dialog.description, "{date}", restorableUntil)}
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
                run(() => requestHouseholdDeletionAction());
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
