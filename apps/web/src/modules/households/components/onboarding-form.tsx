"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState } from "@/lib/action-state";

import { createHouseholdAction } from "../actions";
import { t } from "../strings";
import {
  DEFAULT_RESERVE_MULTIPLE,
  DEFAULT_TIME_ZONE,
  IANA_TIME_ZONES,
  MAX_RESERVE_MULTIPLE,
  MIN_RESERVE_MULTIPLE,
} from "../validation";

const TIME_ZONE_ITEMS = IANA_TIME_ZONES.map((timeZone) => ({ value: timeZone, label: timeZone }));

const RESERVE_MULTIPLE_ITEMS = Array.from(
  { length: MAX_RESERVE_MULTIPLE - MIN_RESERVE_MULTIPLE + 1 },
  (_, index) => {
    const months = String(MIN_RESERVE_MULTIPLE + index);
    return { value: months, label: months };
  },
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
        <Select name="timeZone" items={TIME_ZONE_ITEMS} defaultValue={DEFAULT_TIME_ZONE}>
          <SelectTrigger id="timeZone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_ZONE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reserveMultiple">{t.onboarding.reserveMultipleLabel}</Label>
        <Select
          name="reserveMultiple"
          items={RESERVE_MULTIPLE_ITEMS}
          defaultValue={String(DEFAULT_RESERVE_MULTIPLE)}
        >
          <SelectTrigger id="reserveMultiple">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESERVE_MULTIPLE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
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
