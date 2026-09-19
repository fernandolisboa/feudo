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
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { removeCredentialsAction } from "../actions";
import { t } from "../strings";

export function RemoveCredentialsDialog() {
  const [open, setOpen] = useState(false);
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.connectFailed);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="ghost" size="sm" />}>
        {t.connections.removeCredentialsAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.connections.removeCredentialsDialog.title}</DialogTitle>
          <DialogDescription>{t.connections.removeCredentialsDialog.description}</DialogDescription>
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
            {t.connections.removeCredentialsDialog.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              run(async () => {
                const result = await removeCredentialsAction();
                if (result.status === "success") {
                  setOpen(false);
                }
                return result;
              });
            }}
          >
            {t.connections.removeCredentialsDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
