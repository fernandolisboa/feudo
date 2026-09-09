"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialActionState } from "@/modules/auth";

import { createHouseholdAction } from "../actions";
import { t } from "../strings";
import {
  DEFAULT_RESERVE_MULTIPLE,
  DEFAULT_TIME_ZONE,
  IANA_TIME_ZONES,
  MAX_RESERVE_MULTIPLE,
  MIN_RESERVE_MULTIPLE,
} from "../validation";

const RESERVE_MULTIPLE_OPTIONS = Array.from(
  { length: MAX_RESERVE_MULTIPLE - MIN_RESERVE_MULTIPLE + 1 },
  (_, index) => MIN_RESERVE_MULTIPLE + index,
);

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(createHouseholdAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t.onboarding.nameLabel}</Label>
        <Input
          id="name"
          name="name"
          placeholder={t.onboarding.namePlaceholder}
          autoComplete="off"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timeZone">{t.onboarding.timeZoneLabel}</Label>
        <Select name="timeZone" defaultValue={DEFAULT_TIME_ZONE}>
          <SelectTrigger id="timeZone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IANA_TIME_ZONES.map((timeZone) => (
              <SelectItem key={timeZone} value={timeZone}>
                {timeZone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reserveMultiple">{t.onboarding.reserveMultipleLabel}</Label>
        <Select name="reserveMultiple" defaultValue={String(DEFAULT_RESERVE_MULTIPLE)}>
          <SelectTrigger id="reserveMultiple">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESERVE_MULTIPLE_OPTIONS.map((months) => (
              <SelectItem key={months} value={String(months)}>
                {months}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">{t.onboarding.reserveMultipleHelp}</p>
      </div>

      <Button type="submit" disabled={isPending}>
        {t.onboarding.submit}
      </Button>
    </form>
  );
}
