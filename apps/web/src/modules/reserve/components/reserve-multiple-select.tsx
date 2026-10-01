"use client";

import { MAX_RESERVE_MULTIPLE, MIN_RESERVE_MULTIPLE } from "@feudo/core";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState } from "@/lib/action-state";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { updateReserveMultipleAction } from "../actions";
import { t } from "../strings";

const ITEMS = Array.from(
  { length: MAX_RESERVE_MULTIPLE - MIN_RESERVE_MULTIPLE + 1 },
  (_, index) => {
    const months = String(MIN_RESERVE_MULTIPLE + index);
    return { value: months, label: months };
  },
);

export function ReserveMultipleSelect({ multiple }: { multiple: number }) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.failed);

  function handleValueChange(value: string | null) {
    if (value === null || Number(value) === multiple) {
      return;
    }
    const formData = new FormData();
    formData.set("reserveMultiple", value);
    run(() => updateReserveMultipleAction(initialActionState, formData));
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Select
        items={ITEMS}
        value={String(multiple)}
        onValueChange={handleValueChange}
        disabled={isPending}
      >
        <SelectTrigger aria-label={t.multipleSelect.label} className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errorMessage ? <span className="text-destructive text-xs">{errorMessage}</span> : null}
    </div>
  );
}
