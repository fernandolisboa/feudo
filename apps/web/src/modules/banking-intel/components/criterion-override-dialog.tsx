"use client";

import { useActionState, useState } from "react";

import type { BankProfileCriterion } from "@feudo/core";

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
import { initialActionState } from "@/lib/action-state";
import { interpolateAll } from "@/lib/interpolate";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import { saveCriterionOverrideAction } from "../actions";
import { t } from "../strings";
import { OVERRIDE_NOTE_MAX_LENGTH, OVERRIDE_SOURCE_URL_MAX_LENGTH } from "../validation";

export function CriterionOverrideDialog({
  institutionId,
  bankName,
  criterion,
  seenReviewedAt,
  criterionLabel,
  triggerLabel,
  defaults,
}: {
  institutionId: string;
  bankName: string;
  criterion: BankProfileCriterion;
  seenReviewedAt: string;
  criterionLabel: string;
  triggerLabel: string;
  defaults: { score: number | null; note: string; sourceUrl: string };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    saveCriterionOverrideAction,
    initialActionState,
  );
  const fieldId = (name: string) => `override-${criterion}-${name}`;

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {interpolateAll(t.override.title, { criterion: criterionLabel, bank: bankName })}
            </DialogTitle>
            <DialogDescription>{t.override.description}</DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <input type="hidden" name="institutionId" value={institutionId} />
          <input type="hidden" name="criterion" value={criterion} />
          <input type="hidden" name="seenReviewedAt" value={seenReviewedAt} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId("score")}>{t.override.score}</Label>
            <Input
              id={fieldId("score")}
              name="score"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              required
              defaultValue={defaults.score ?? undefined}
              className="w-28 tabular-nums"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId("note")}>{t.override.note}</Label>
            <Textarea
              id={fieldId("note")}
              name="note"
              required
              maxLength={OVERRIDE_NOTE_MAX_LENGTH}
              placeholder={t.override.notePlaceholder}
              defaultValue={defaults.note}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId("source")}>{t.override.sourceUrl}</Label>
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
              {t.override.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.override.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
