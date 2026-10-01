"use client";

import { startTransition, useActionState, useState } from "react";

import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import { SectionHeader } from "@/ui/section-header";
import { Switch } from "@/ui/switch";
import { initialActionState } from "@/lib/action-state";

import { resetToursAction, updateTourAutoStartAction } from "../actions";
import { t } from "../strings";

export function TourPreferencesForm({ autoStart }: { autoStart: boolean }) {
  const [autoStartState, autoStartAction] = useActionState(
    updateTourAutoStartAction,
    initialActionState,
  );
  const [resetState, resetAction, isResetting] = useActionState(
    resetToursAction,
    initialActionState,
  );
  const [checked, setChecked] = useState(autoStart);

  const [lastHandledState, setLastHandledState] = useState(autoStartState);
  if (autoStartState !== lastHandledState) {
    setLastHandledState(autoStartState);
    if (autoStartState.status === "error") {
      setChecked(autoStart);
    }
  }

  function handleCheckedChange(next: boolean): void {
    setChecked(next);
    const formData = new FormData();
    formData.set("autoStart", next ? "on" : "off");
    startTransition(() => {
      autoStartAction(formData);
    });
  }

  return (
    <section className="mt-8">
      <SectionHeader title={t.preferences.title} />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <Switch id="tours-auto-start" checked={checked} onCheckedChange={handleCheckedChange} />
            <Label htmlFor="tours-auto-start">{t.preferences.autoStartLabel}</Label>
          </div>
          <p className="text-muted-foreground text-sm">{t.preferences.autoStartDescription}</p>
          {autoStartState.status === "idle" ? null : (
            <p
              className={
                autoStartState.status === "error"
                  ? "text-destructive text-sm"
                  : "text-muted-foreground text-sm"
              }
              role="status"
            >
              {autoStartState.message}
            </p>
          )}
        </div>

        <form action={resetAction} className="flex flex-col items-start gap-1.5">
          <Button type="submit" variant="outline" disabled={isResetting}>
            {t.preferences.reset}
          </Button>
          <p className="text-muted-foreground text-sm">{t.preferences.resetDescription}</p>
          {resetState.status === "idle" ? null : (
            <p
              className={
                resetState.status === "error"
                  ? "text-destructive text-sm"
                  : "text-muted-foreground text-sm"
              }
              role="status"
            >
              {resetState.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
