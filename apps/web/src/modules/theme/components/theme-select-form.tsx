"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialActionState } from "../action-state";
import { updateThemeAction } from "../actions";
import { t } from "../strings";
import { THEME_NAMES, type ThemeName } from "../tokens";

export function ThemeSelectForm({ currentTheme }: { currentTheme: ThemeName }) {
  const [state, formAction] = useActionState(updateThemeAction, initialActionState);

  function handleValueChange(value: string | null): void {
    if (!value) {
      return;
    }
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
        <Select defaultValue={currentTheme} onValueChange={handleValueChange}>
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
