"use client";

import { Alert, AlertDescription } from "@/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { switchHouseholdAction } from "../actions";
import { t } from "../strings";
import type { HouseholdSummary } from "../service";

export function HouseholdSwitcherSelect({
  households,
  activeHouseholdId,
}: {
  households: HouseholdSummary[];
  activeHouseholdId: string;
}) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.switchFailed);

  function handleValueChange(householdId: string | null) {
    if (!householdId || householdId === activeHouseholdId) {
      return;
    }
    run(() => switchHouseholdAction(householdId));
  }

  const items = households.map((household) => ({ value: household.id, label: household.name }));

  return (
    <div className="flex flex-col gap-1.5">
      <Select
        items={items}
        value={activeHouseholdId}
        onValueChange={handleValueChange}
        disabled={isPending}
      >
        <SelectTrigger aria-label={t.switcher.label}>
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
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
