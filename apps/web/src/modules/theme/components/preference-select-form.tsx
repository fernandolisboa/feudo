"use client";

import { useActionState, useState, type ReactNode } from "react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { blockWriteWhenOffline } from "@/lib/offline-writes";

export type PreferenceOption<Value extends string> = {
  value: Value;
  label: string;
  hint: string;
  preview: ReactNode;
};

export function PreferenceSelectForm<Value extends string>({
  field,
  label,
  description,
  options,
  currentValue,
  isValid,
  action,
}: {
  field: string;
  label: string;
  description: string;
  options: readonly PreferenceOption<Value>[];
  currentValue: Value;
  isValid: (value: string) => value is Value;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [selectedValue, setSelectedValue] = useState<Value>(currentValue);
  const items = options.map((option) => ({ value: option.value, label: option.label }));

  // Rolls back an optimistic selection the server rejected. Adjusted during
  // render (React's "storing information from previous renders" pattern),
  // not an effect, so the rollback lands in the same commit as the failure.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.status === "error") {
      setSelectedValue(currentValue);
    }
  }

  function handleValueChange(value: string | null): void {
    if (!value || !isValid(value) || blockWriteWhenOffline()) {
      return;
    }
    setSelectedValue(value);
    // Builds FormData from the value onValueChange hands us, rather than
    // reading a hidden form input and calling requestSubmit(): that input's
    // DOM value lags one React commit behind onValueChange, so
    // requestSubmit() would race and submit the previous selection.
    const formData = new FormData();
    formData.set(field, value);
    formAction(formData);
  }

  const selectedOption = options.find((option) => option.value === selectedValue);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={field}>{label}</Label>
        <Select items={items} value={selectedValue} onValueChange={handleValueChange}>
          <SelectTrigger id={field} className="w-64">
            <SelectValue>
              {selectedOption ? (
                <span className="flex items-center gap-2">
                  {selectedOption.preview}
                  <span>{selectedOption.label}</span>
                </span>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="min-h-11 md:min-h-9">
                <span className="flex items-center gap-2.5">
                  {option.preview}
                  <span className="flex flex-col whitespace-normal">
                    <span>{option.label}</span>
                    <span className="text-muted-foreground text-xs">{option.hint}</span>
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground max-w-prose text-sm">{description}</p>
      </div>

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state.status === "success" ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
