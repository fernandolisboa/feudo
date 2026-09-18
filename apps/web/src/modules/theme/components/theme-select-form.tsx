"use client";

import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState } from "@/lib/action-state";

import { updateThemeAction } from "../actions";
import { t } from "../strings";
import { isThemeName, THEME_NAMES, type ThemeName } from "../tokens";

export function ThemeSelectForm({ currentTheme }: { currentTheme: ThemeName }) {
  const [state, formAction] = useActionState(updateThemeAction, initialActionState);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(currentTheme);

  // Rolls back an optimistic selection the server rejected. Adjusted during
  // render (React's "storing information from previous renders" pattern),
  // not an effect, so the rollback lands in the same commit as the failure.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.status === "error") {
      setSelectedTheme(currentTheme);
    }
  }

  function handleValueChange(value: string | null): void {
    if (!value || !isThemeName(value)) {
      return;
    }
    setSelectedTheme(value);
    // Builds FormData from the value onValueChange hands us, rather than
    // reading a hidden form input and calling requestSubmit(): that input's
    // DOM value lags one React commit behind onValueChange, so
    // requestSubmit() would race and submit the previous selection.
    const formData = new FormData();
    formData.set("theme", value);
    formAction(formData);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="theme">{t.preferences.themeLabel}</Label>
        <Select value={selectedTheme} onValueChange={handleValueChange}>
          <SelectTrigger id="theme" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEME_NAMES.map((theme) => (
              <SelectItem key={theme} value={theme}>
                {t.preferences.themeNames[theme]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">{t.preferences.themeDescription}</p>
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
