"use client";

import { useTransition } from "react";

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

  function handleValueChange(householdId: string | null) {
    if (!householdId || householdId === activeHouseholdId) {
      return;
    }
    startTransition(() => {
      void switchHouseholdAction(householdId);
    });
  }

  return (
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
  );
}
