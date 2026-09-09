"use client";

import { useActionState, useRef } from "react";

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
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="theme">{t.preferences.themeLabel}</Label>
        <Select
          name="theme"
          defaultValue={currentTheme}
          onValueChange={() => formRef.current?.requestSubmit()}
        >
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
    </form>
  );
}
