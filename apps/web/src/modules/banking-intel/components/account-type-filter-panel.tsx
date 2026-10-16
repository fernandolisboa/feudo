"use client";

import { useState } from "react";
import type { AccountTypeFilter, RequirementLevel } from "@feudo/core";

import { Checkbox } from "@/ui/checkbox";
import { Label } from "@/ui/label";
import { SectionHeader } from "@/ui/section-header";
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group";
import { initialActionState } from "@/lib/action-state";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { updateAccountTypeFilterAction } from "../actions";
import { t } from "../strings";
import { accountTypeFilterFormEntries } from "../validation";

type FilterRowKey = "jointBanking" | "jointInvestment" | "mei";

function toFormData(filter: AccountTypeFilter): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(accountTypeFilterFormEntries(filter))) {
    formData.set(key, value);
  }
  return formData;
}

function LevelToggle({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: RequirementLevel;
  disabled: boolean;
  onChange: (value: RequirementLevel) => void;
}) {
  return (
    <ToggleGroup
      value={value}
      disabled={disabled}
      aria-label={label}
      onValueChange={(next) => {
        if (next === "optional" || next === "required") onChange(next);
      }}
    >
      <ToggleGroupItem value="optional">{t.accountTypes.levelOptional}</ToggleGroupItem>
      <ToggleGroupItem value="required">{t.accountTypes.levelRequired}</ToggleGroupItem>
    </ToggleGroup>
  );
}

const ROWS: { key: FilterRowKey; label: string; help: string }[] = [
  { key: "jointBanking", ...t.accountTypes.filters.jointBanking },
  { key: "jointInvestment", ...t.accountTypes.filters.jointInvestment },
  { key: "mei", ...t.accountTypes.filters.mei },
];

// Saves on every change, like the criteria weights editor (CriteriaWeightsEditor):
// the server's props are the source of truth, and a draft the household is
// mid-change on is only ever derived from them, never kept across a prop
// change it did not cause itself.
export function AccountTypeFilterPanel({ filter }: { filter: AccountTypeFilter }) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.failed);
  const [draft, setDraft] = useState<AccountTypeFilter | null>(null);
  const [lastFilter, setLastFilter] = useState(filter);
  if (filter !== lastFilter) {
    setLastFilter(filter);
    setDraft(null);
  }

  const [lastErrorMessage, setLastErrorMessage] = useState(errorMessage);
  if (errorMessage !== lastErrorMessage) {
    setLastErrorMessage(errorMessage);
    if (errorMessage !== null) setDraft(null);
  }

  const state = draft ?? filter;

  function save(next: AccountTypeFilter) {
    setDraft(next);
    run(() => updateAccountTypeFilterAction(initialActionState, toFormData(next)));
  }

  return (
    <section className="mb-6">
      <SectionHeader title={t.accountTypes.panelTitle} />
      <ul className="divide-border flex flex-col divide-y border-y">
        {ROWS.map((row) => (
          <li key={row.key} className="flex flex-col gap-2 py-2">
            <div className="grid min-h-[var(--density-row)] grid-cols-[1fr_auto] items-center gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-[14px]">{row.label}</span>
                <span className="text-muted-foreground text-[12px]">{row.help}</span>
              </div>
              <LevelToggle
                label={row.label}
                value={state[row.key]}
                disabled={isPending}
                onChange={(value) => {
                  save({ ...state, [row.key]: value });
                }}
              />
            </div>
            {row.key === "jointBanking" && state.jointBanking === "required" ? (
              <Label className="flex items-center gap-2 pl-0.5 text-[13px] font-normal">
                <Checkbox
                  checked={state.jointOnly}
                  disabled={isPending}
                  onCheckedChange={(checked) => {
                    save({ ...state, jointOnly: checked });
                  }}
                />
                {t.accountTypes.jointOnly}
              </Label>
            ) : null}
          </li>
        ))}
      </ul>
      {errorMessage ? (
        <span role="alert" className="text-destructive mt-3 block text-[13px]">
          {errorMessage}
        </span>
      ) : null}
    </section>
  );
}

export function AccountTypeFilterReadOnly({ filter }: { filter: AccountTypeFilter }) {
  return (
    <section className="mb-6">
      <SectionHeader title={t.accountTypes.panelTitle} />
      <ul className="divide-border flex flex-col divide-y border-y">
        {ROWS.map((row) => (
          <li key={row.key} className="flex flex-col gap-1 py-2">
            <div className="grid min-h-[var(--density-row)] grid-cols-[1fr_auto] items-center gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-[14px]">{row.label}</span>
                <span className="text-muted-foreground text-[12px]">{row.help}</span>
              </div>
              <span className="text-[14px]">
                {levelOf(row.key, filter) === "required"
                  ? t.accountTypes.levelRequired
                  : t.accountTypes.levelOptional}
              </span>
            </div>
            {row.key === "jointBanking" &&
            filter.jointBanking === "required" &&
            filter.jointOnly ? (
              <span className="text-muted-foreground text-[12px]">{t.accountTypes.jointOnly}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-3 text-[13px]">{t.accountTypes.readOnly}</p>
    </section>
  );
}

function levelOf(key: FilterRowKey, filter: AccountTypeFilter): RequirementLevel {
  return filter[key];
}
