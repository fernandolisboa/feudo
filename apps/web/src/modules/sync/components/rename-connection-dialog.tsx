"use client";

import { useActionState, useState } from "react";

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
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { initialActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import { renameConnectionAction } from "../actions";
import { t } from "../strings";

export function RenameConnectionDialog({
  connectionId,
  institutionName,
}: {
  connectionId: string;
  institutionName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(renameConnectionAction, initialActionState);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="ghost" size="sm" />}>
        {t.connections.renameAction}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="connectionId" value={connectionId} />
          <DialogHeader>
            <DialogTitle>
              {interpolate(t.connections.renameDialog.title, "{institution}", institutionName)}
            </DialogTitle>
            <DialogDescription>{t.connections.renameDialog.description}</DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`rename-connection-${connectionId}`}>
              {t.connections.renameDialog.label}
            </Label>
            <Input
              id={`rename-connection-${connectionId}`}
              name="institutionName"
              autoComplete="off"
              defaultValue={institutionName}
              maxLength={80}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              {t.connections.renameDialog.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.connections.renameDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
