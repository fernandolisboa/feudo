"use client";

import { useId } from "react";

import { PAGE_SIZE_OPTIONS, isPageSize, type PageSize } from "./page-size";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const ITEMS = PAGE_SIZE_OPTIONS.map((size) => ({ value: size, label: String(size) }));

export function PageSizeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PageSize;
  onChange: (size: PageSize) => void;
}) {
  const labelId = useId();

  function handleValueChange(next: number | null) {
    if (next === null || next === value || !isPageSize(next)) {
      return;
    }
    onChange(next);
  }

  return (
    <div className="flex items-center gap-2">
      <span id={labelId} className="text-muted-foreground text-xs whitespace-nowrap">
        {label}
      </span>
      <Select items={ITEMS} value={value} onValueChange={handleValueChange}>
        <SelectTrigger aria-labelledby={labelId} size="sm" className="tabular-nums">
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
    </div>
  );
}
