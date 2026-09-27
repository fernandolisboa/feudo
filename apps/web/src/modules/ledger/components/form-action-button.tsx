"use client";

import { useActionState } from "react";

import { Button } from "@/ui/button";
import { initialActionState, type ActionState } from "@/lib/action-state";

export function FormActionButton({
  action,
  fields,
  label,
  ariaLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: string;
  ariaLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant="ghost" size="sm" disabled={isPending} aria-label={ariaLabel}>
        {label}
      </Button>
      {state.status === "error" ? (
        <span className="text-destructive text-xs">{state.message}</span>
      ) : null}
    </form>
  );
}
