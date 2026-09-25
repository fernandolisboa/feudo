"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
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
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import { addConnectionAction } from "../actions";
import { t } from "../strings";
import { INSTITUTION_NAME_MAX_LENGTH } from "../validation";

export function AddConnectionDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addConnectionAction, initialActionState);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Plus className="size-4" />
        {t.connections.addAction}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t.connections.addDialog.title}</DialogTitle>
            <DialogDescription>{t.connections.addDialog.description}</DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-connection-item-id">{t.connections.addDialog.itemIdLabel}</Label>
            <Input
              id="add-connection-item-id"
              name="providerItemId"
              autoComplete="off"
              spellCheck={false}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-connection-institution-name">{t.form.institutionNameLabel}</Label>
            <Input
              id="add-connection-institution-name"
              name="institutionName"
              autoComplete="off"
              maxLength={INSTITUTION_NAME_MAX_LENGTH}
            />
            <p className="text-muted-foreground text-xs">{t.form.institutionNameHelp}</p>
          </div>

          <Label className="flex items-start gap-2 text-sm font-normal">
            <Checkbox name="accepted" required className="mt-0.5" />
            <span>{t.consent.checkbox}</span>
          </Label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              {t.connections.addDialog.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.connections.addDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
