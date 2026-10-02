"use client";

import { CRITERION_WEIGHT_MAX, CRITERION_WEIGHT_MIN, type BankProfileCriterion } from "@feudo/core";

import { Button } from "@/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState } from "@/lib/action-state";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { resetCriteriaWeightsAction, updateCriteriaWeightsAction } from "../actions";
import type { CriterionWeightView } from "../page-props";
import { t } from "../strings";

const LEVELS = Array.from(
  { length: CRITERION_WEIGHT_MAX - CRITERION_WEIGHT_MIN + 1 },
  (_, index) => {
    const weight = CRITERION_WEIGHT_MIN + index;
    return { value: String(weight), label: t.weights.levels[weight] ?? String(weight) };
  },
);

function CriterionWeightSelect({
  criterion,
  label,
  weights,
  disabled,
  onChange,
}: {
  criterion: BankProfileCriterion;
  label: string;
  weights: readonly CriterionWeightView[];
  disabled: boolean;
  onChange: (formData: FormData) => void;
}) {
  const current = weights.find((entry) => entry.criterion === criterion)?.weight ?? 0;

  function handleValueChange(value: string | null) {
    if (value === null || Number(value) === current) {
      return;
    }
    const formData = new FormData();
    for (const entry of weights) {
      formData.set(entry.criterion, entry.criterion === criterion ? value : String(entry.weight));
    }
    onChange(formData);
  }

  return (
    <Select
      items={LEVELS}
      value={String(current)}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label} className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEVELS.map((level) => (
          <SelectItem key={level.value} value={level.value}>
            {level.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CriteriaWeightsEditor({
  weights,
  weightsAreCustom,
}: {
  weights: CriterionWeightView[];
  weightsAreCustom: boolean;
}) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.failed);

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-border flex flex-col divide-y border-y">
        {weights.map((entry) => (
          <li
            key={entry.criterion}
            className="grid min-h-[var(--density-row)] grid-cols-[1fr_auto] items-center gap-3 py-2"
          >
            <div className="flex min-w-0 flex-col">
              <span className="text-[14px]">{entry.label}</span>
              <span className="text-muted-foreground text-[12px]">{entry.help}</span>
            </div>
            <CriterionWeightSelect
              criterion={entry.criterion}
              label={entry.label}
              weights={weights}
              disabled={isPending}
              onChange={(formData) => {
                run(() => updateCriteriaWeightsAction(initialActionState, formData));
              }}
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        {weightsAreCustom ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              run(() => resetCriteriaWeightsAction());
            }}
          >
            {t.weights.reset}
          </Button>
        ) : null}
        {errorMessage ? (
          <span role="alert" className="text-destructive text-[13px]">
            {errorMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}
