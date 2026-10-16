"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cn } from "@/lib/utils";

// A segmented control: a two-or-more-option exclusive choice, restyled from
// the same toggle-group primitive the other ui/ components are built on
// (base-ui, see select.tsx and checkbox.tsx). Single-select only (DESIGN.md
// has no multi-select use yet); the group never drops below one pressed
// item, since a segmented control for a setting always has a value.
function ToggleGroup({
  className,
  value,
  onValueChange,
  ...props
}: Omit<ToggleGroupPrimitive.Props, "multiple" | "onValueChange" | "value"> & {
  value: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      value={[value]}
      onValueChange={(next) => {
        if (next.length === 0) return;
        onValueChange?.(next[0] as string);
      }}
      className={cn("bg-muted inline-flex w-fit items-center gap-0.5 rounded-lg p-0.5", className)}
      {...props}
    />
  );
}

function ToggleGroupItem({ className, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "data-pressed:bg-background data-pressed:text-foreground text-muted-foreground focus-visible:ring-ring/50 inline-flex h-11 min-w-16 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:h-9",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
