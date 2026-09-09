"use client";

import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleValueChange(householdId: string | null) {
    if (!householdId || householdId === activeHouseholdId) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await switchHouseholdAction(householdId);
      if (result.status === "error") {
        setError(result.message);
      }
    });
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
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
