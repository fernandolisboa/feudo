"use client";

import { PanelBottom, PanelLeft, PanelTop, type LucideIcon } from "lucide-react";

import { updateLayoutAction } from "../actions";
import { t } from "../strings";
import { isShellLayout, SHELL_LAYOUTS, type ShellLayout } from "../tokens";

import { PreferenceSelectForm, type PreferenceOption } from "./preference-select-form";

const LAYOUT_ICONS: Record<ShellLayout, LucideIcon> = {
  sidebar: PanelLeft,
  topnav: PanelTop,
  dock: PanelBottom,
};

const LAYOUT_OPTIONS: PreferenceOption<ShellLayout>[] = SHELL_LAYOUTS.map((layout) => {
  const Icon = LAYOUT_ICONS[layout];
  return {
    value: layout,
    label: t.preferences.layoutNames[layout],
    hint: t.preferences.layoutHints[layout],
    preview: <Icon className="text-muted-foreground size-4" aria-hidden="true" />,
  };
});

export function LayoutSelectForm({ currentLayout }: { currentLayout: ShellLayout }) {
  return (
    <PreferenceSelectForm
      field="layout"
      label={t.preferences.layoutLabel}
      description={t.preferences.layoutDescription}
      options={LAYOUT_OPTIONS}
      currentValue={currentLayout}
      isValid={isShellLayout}
      action={updateLayoutAction}
    />
  );
}
