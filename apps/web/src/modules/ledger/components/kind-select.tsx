"use client";

import type { Kind } from "@feudo/core";
import { KINDS } from "@feudo/core";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { changeSubcategoryKindAction } from "../actions";
import { t } from "../strings";

const items = KINDS.map((kind) => ({ value: kind, label: t.kinds[kind] }));

export function KindSelect({
  subcategoryValue,
  subcategoryLabel,
  kind,
}: {
  subcategoryValue: string;
  subcategoryLabel: string;
  kind: Kind;
}) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.failed);

  function handleValueChange(value: Kind | null) {
    if (value === null || value === kind) {
      return;
    }
    const formData = new FormData();
    formData.set("subcategory", subcategoryValue);
    formData.set("kind", value);
    run(() => changeSubcategoryKindAction(initialActionState, formData));
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Select items={items} value={kind} onValueChange={handleValueChange} disabled={isPending}>
        <SelectTrigger
          size="sm"
          aria-label={interpolate(t.categoriesPage.kindLabelFor, "{subcategory}", subcategoryLabel)}
          className="w-36"
        >
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
      {errorMessage ? <span className="text-destructive text-xs">{errorMessage}</span> : null}
    </div>
  );
}
