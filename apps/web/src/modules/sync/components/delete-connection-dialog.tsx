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
import { initialActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import { deleteConnectionAction } from "../actions";
import { t } from "../strings";

export function DeleteConnectionDialog({
  connectionId,
  institutionName,
}: {
  connectionId: string;
  institutionName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(deleteConnectionAction, initialActionState);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="ghost" size="sm" />}>
        {t.connections.deleteAction}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="connectionId" value={connectionId} />
          <DialogHeader>
            <DialogTitle>
              {interpolate(t.connections.deleteDialog.title, "{institution}", institutionName)}
            </DialogTitle>
            <DialogDescription>{t.connections.deleteDialog.description}</DialogDescription>
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
                setOpen(false);
              }}
            >
              {t.connections.deleteDialog.cancel}
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {t.connections.deleteDialog.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
