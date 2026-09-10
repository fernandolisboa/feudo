"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  return (
    <div className="flex flex-col gap-1.5">
      <Select value={activeHouseholdId} onValueChange={handleValueChange} disabled={isPending}>
        <SelectTrigger aria-label={t.switcher.label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {households.map((household) => (
            <SelectItem key={household.id} value={household.id}>
              {household.name}
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
