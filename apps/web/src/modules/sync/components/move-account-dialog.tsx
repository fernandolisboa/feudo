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
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";
import type { HouseholdSummary } from "@/modules/households";

import { moveAccountAction } from "../actions";
import { t } from "../strings";

export function MoveAccountDialog({
  accountId,
  accountName,
  destinations,
}: {
  accountId: string;
  accountName: string;
  destinations: HouseholdSummary[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(moveAccountAction, initialActionState);
  const items = destinations.map((household) => ({ value: household.id, label: household.name }));

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label={interpolate(t.connections.moveActionFor, "{account}", accountName)}
          />
        }
      >
        {t.connections.moveAction}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="accountId" value={accountId} />
          <DialogHeader>
            <DialogTitle>
              {interpolate(t.connections.moveDialog.title, "{account}", accountName)}
            </DialogTitle>
            <DialogDescription>{t.connections.moveDialog.description}</DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`move-account-${accountId}`}>{t.connections.moveDialog.label}</Label>
            <Select name="householdId" items={items} defaultValue={items[0]?.value}>
              <SelectTrigger id={`move-account-${accountId}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              {t.connections.moveDialog.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.connections.moveDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
