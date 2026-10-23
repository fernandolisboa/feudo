"use client";

import { updateThemeAction } from "../actions";
import { t } from "../strings";
import { isThemeName, THEME_NAMES, type ThemeName } from "../tokens";

import { PreferenceSelectForm, type PreferenceOption } from "./preference-select-form";

const THEME_OPTIONS: PreferenceOption<ThemeName>[] = THEME_NAMES.map((theme) => ({
  value: theme,
  label: t.preferences.themeNames[theme],
  hint: t.preferences.themeHints[theme],
  preview: (
    <span className="theme-swatch" data-theme={theme} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  ),
}));

export function ThemeSelectForm({ currentTheme }: { currentTheme: ThemeName }) {
  return (
    <PreferenceSelectForm
      field="theme"
      label={t.preferences.themeLabel}
      description={t.preferences.themeDescription}
      options={THEME_OPTIONS}
      currentValue={currentTheme}
      isValid={isThemeName}
      action={updateThemeAction}
    />
  );
}
