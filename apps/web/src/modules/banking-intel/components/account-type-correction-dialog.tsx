"use client";

import { useActionState, useState } from "react";

import type { AccountType } from "@feudo/core";

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
import { Textarea } from "@/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group";
import { initialActionState } from "@/lib/action-state";
import { interpolateAll } from "@/lib/interpolate";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import { saveAccountTypeOverrideAction } from "../actions";
import { t } from "../strings";
import { OVERRIDE_NOTE_MAX_LENGTH, OVERRIDE_SOURCE_URL_MAX_LENGTH } from "../validation";

export function AccountTypeCorrectionDialog({
  institutionId,
  bankName,
  accountType,
  seenReviewedAt,
  typeLabel,
  triggerLabel,
  defaults,
}: {
  institutionId: string;
  bankName: string;
  accountType: AccountType;
  seenReviewedAt: string;
  typeLabel: string;
  triggerLabel: string;
  defaults: { offered: boolean | null; note: string; sourceUrl: string };
}) {
  const [open, setOpen] = useState(false);
  const [offered, setOffered] = useState(defaults.offered ?? true);
  const [state, formAction, isPending] = useActionState(
    saveAccountTypeOverrideAction,
    initialActionState,
  );
  const fieldId = (name: string) => `account-type-override-${accountType}-${name}`;

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setOffered(defaults.offered ?? true);
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {interpolateAll(t.accountTypes.dialog.title, { type: typeLabel, bank: bankName })}
            </DialogTitle>
            <DialogDescription>{t.accountTypes.dialog.description}</DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <input type="hidden" name="institutionId" value={institutionId} />
          <input type="hidden" name="accountType" value={accountType} />
          <input type="hidden" name="seenReviewedAt" value={seenReviewedAt} />
          <input type="hidden" name="offered" value={offered ? "true" : "false"} />

          <div className="flex flex-col gap-1.5">
            <Label>{t.accountTypes.dialog.offered}</Label>
            <ToggleGroup
              value={offered ? "yes" : "no"}
              onValueChange={(value) => {
                setOffered(value === "yes");
              }}
              aria-label={t.accountTypes.dialog.offered}
            >
              <ToggleGroupItem value="yes">{t.accountTypes.dialog.offeredYes}</ToggleGroupItem>
              <ToggleGroupItem value="no">{t.accountTypes.dialog.offeredNo}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId("note")}>{t.accountTypes.dialog.note}</Label>
            <Textarea
              id={fieldId("note")}
              name="note"
              required
              maxLength={OVERRIDE_NOTE_MAX_LENGTH}
              placeholder={t.accountTypes.dialog.notePlaceholder}
              defaultValue={defaults.note}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId("source")}>{t.accountTypes.dialog.sourceUrl}</Label>
            <Input
              id={fieldId("source")}
              name="sourceUrl"
              type="url"
              inputMode="url"
              maxLength={OVERRIDE_SOURCE_URL_MAX_LENGTH}
              placeholder="https://"
              pattern="https://.+"
              defaultValue={defaults.sourceUrl}
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
              {t.accountTypes.dialog.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.accountTypes.dialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
