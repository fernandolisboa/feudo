"use client";

import { useMemo, useState } from "react";
import {
  BANK_PROFILE_CRITERIA,
  CANDIDATE_COUNT_MAX,
  CANDIDATE_COUNT_MIN,
  criterionShares,
  effectiveWeights,
  MINIMUM_SCORE_MAX,
  MINIMUM_SCORE_MIN,
  MINIMUM_SCORE_STEP,
  PRO_CON_MIN_DIFFERENCE_MAX,
  PRO_CON_MIN_DIFFERENCE_MIN,
  PRO_CON_MIN_DIFFERENCE_STEP,
  type BankProfileCriterion,
  type CriterionWeightLevel,
  type WeightLevels,
} from "@feudo/core";

import { Button } from "@/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Slider } from "@/ui/slider";
import { initialActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { resetCriteriaWeightsAction, updateComparisonSettingsAction } from "../actions";
import { levelLabel } from "../level-label";
import type { ComparisonOptionsView, CriterionWeightView } from "../page-props";
import { t } from "../strings";
import { minimumScoreFieldName } from "../validation";

type LevelValue = `${number}` | "essential" | "required";

function levelToValue(level: CriterionWeightLevel): LevelValue {
  return typeof level === "number" ? (String(level) as LevelValue) : level;
}

function valueToLevel(value: LevelValue): CriterionWeightLevel {
  if (value === "essential" || value === "required") return value;
  return Number(value) as CriterionWeightLevel;
}

const LEVEL_VALUES: LevelValue[] = [
  ...Array.from({ length: 6 }, (_, weight) => String(weight) as LevelValue),
  "essential",
  "required",
];

const LEVEL_OPTIONS: { value: LevelValue; label: string }[] = LEVEL_VALUES.map((value) => ({
  value,
  label: levelLabel(valueToLevel(value)),
}));

type EditorState = {
  levels: Record<BankProfileCriterion, LevelValue>;
  minimumScores: Record<BankProfileCriterion, number>;
  candidateCount: number;
  proConMinDifference: number;
};

function stateFromProps(
  weights: CriterionWeightView[],
  options: ComparisonOptionsView,
): EditorState {
  return {
    levels: Object.fromEntries(
      weights.map((entry) => [entry.criterion, levelToValue(entry.level)]),
    ) as Record<BankProfileCriterion, LevelValue>,
    minimumScores: Object.fromEntries(
      weights.map((entry) => [entry.criterion, entry.minimumScore]),
    ) as Record<BankProfileCriterion, number>,
    candidateCount: options.candidateCount,
    proConMinDifference: options.proConMinDifference,
  };
}

function toFormData(state: EditorState): FormData {
  const formData = new FormData();
  for (const criterion of BANK_PROFILE_CRITERIA) {
    formData.set(criterion, state.levels[criterion]);
    formData.set(minimumScoreFieldName(criterion), String(state.minimumScores[criterion]));
  }
  formData.set("candidateCount", String(state.candidateCount));
  formData.set("proConMinDifference", String(state.proConMinDifference));
  return formData;
}

function effectiveLevels(state: EditorState): WeightLevels {
  return Object.fromEntries(
    BANK_PROFILE_CRITERIA.map((criterion) => [criterion, valueToLevel(state.levels[criterion])]),
  ) as WeightLevels;
}

// The server's props are the source of truth: what is on screen is always
// either the latest props, turned into editor state, or a draft the household
// is actively making (a select just picked, or a slider mid-drag) that has
// not reached the server yet. Nothing here survives a prop change on its own
// (a reset, a rejected save, another admin saving first) without being
// derived from props again.
export function CriteriaWeightsEditor({
  weights,
  options,
  weightsAreCustom,
}: {
  weights: CriterionWeightView[];
  options: ComparisonOptionsView;
  weightsAreCustom: boolean;
}) {
  const { errorMessage, isPending, run } = useActionInTransition(t.errors.failed);
  const serverState = useMemo(() => stateFromProps(weights, options), [weights, options]);
  const [draft, setDraft] = useState<EditorState | null>(null);

  // Adjusting state during render, not in an effect (React's own pattern for
  // "reset a derived draft when its source changes"): a new serverState (new
  // props) or a freshly failed save both mean whatever the household was
  // looking at no longer matches the server, so the draft is stale and the
  // next render should fall back to serverState instead.
  const [lastServerState, setLastServerState] = useState(serverState);
  const [lastErrorMessage, setLastErrorMessage] = useState(errorMessage);
  if (serverState !== lastServerState) {
    setLastServerState(serverState);
    setDraft(null);
  }
  if (errorMessage !== lastErrorMessage) {
    setLastErrorMessage(errorMessage);
    if (errorMessage !== null) setDraft(null);
  }

  const state = draft ?? serverState;
  const shares = useMemo(() => criterionShares(effectiveWeights(effectiveLevels(state))), [state]);

  function save(next: EditorState) {
    setDraft(next);
    run(() => updateComparisonSettingsAction(initialActionState, toFormData(next)));
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-border flex flex-col divide-y border-y">
        {weights.map((entry) => {
          const level = state.levels[entry.criterion];
          const isRequired = level === "required";
          const minimumScore = state.minimumScores[entry.criterion];
          return (
            <li key={entry.criterion} className="flex flex-col gap-2 py-2">
              <div className="grid min-h-[var(--density-row)] grid-cols-[1fr_auto_auto] items-center gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-[14px]">{entry.label}</span>
                  <span className="text-muted-foreground text-[12px]">{entry.help}</span>
                </div>
                <span className="text-muted-foreground text-[12px] tabular-nums">
                  {interpolate(t.weights.share, "{share}", String(shares[entry.criterion]))}
                </span>
                <Select
                  items={LEVEL_OPTIONS}
                  value={level}
                  onValueChange={(value) => {
                    if (value === null || value === level) return;
                    save({ ...state, levels: { ...state.levels, [entry.criterion]: value } });
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger aria-label={entry.label} className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isRequired ? (
                <div className="flex flex-col gap-1 pb-1">
                  <span className="text-[13px] tabular-nums">
                    {interpolate(t.weights.minimumScore, "{score}", String(minimumScore))}
                  </span>
                  <Slider
                    aria-label={interpolate(
                      t.weights.minimumScore,
                      "{score}",
                      String(minimumScore),
                    )}
                    min={MINIMUM_SCORE_MIN}
                    max={MINIMUM_SCORE_MAX}
                    step={MINIMUM_SCORE_STEP}
                    value={minimumScore}
                    disabled={isPending}
                    onValueChange={(value) => {
                      setDraft({
                        ...state,
                        minimumScores: { ...state.minimumScores, [entry.criterion]: value },
                      });
                    }}
                    onValueCommitted={(value) => {
                      save({
                        ...state,
                        minimumScores: { ...state.minimumScores, [entry.criterion]: value },
                      });
                    }}
                  />
                  {entry.minimumScoreHint ? (
                    <span className="text-muted-foreground text-[12px]">
                      {entry.minimumScoreHint}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
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
      <ComparisonOptionsEditor
        candidateCount={state.candidateCount}
        proConMinDifference={state.proConMinDifference}
        disabled={isPending}
        onLiveChange={(next) => {
          setDraft({ ...state, ...next });
        }}
        onCommit={(next) => {
          save({ ...state, ...next });
        }}
      />
    </div>
  );
}

function ComparisonOptionsEditor({
  candidateCount,
  proConMinDifference,
  disabled,
  onLiveChange,
  onCommit,
}: {
  candidateCount: number;
  proConMinDifference: number;
  disabled: boolean;
  onLiveChange: (next: { candidateCount: number; proConMinDifference: number }) => void;
  onCommit: (next: { candidateCount: number; proConMinDifference: number }) => void;
}) {
  return (
    <section className="flex flex-col gap-4 border-t pt-4">
      <h3 className="text-[14px]">{t.options.title}</h3>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] tabular-nums">
          {t.options.candidateCount}: {candidateCount}
        </span>
        <Slider
          aria-label={t.options.candidateCount}
          min={CANDIDATE_COUNT_MIN}
          max={CANDIDATE_COUNT_MAX}
          step={1}
          value={candidateCount}
          disabled={disabled}
          onValueChange={(value) => {
            onLiveChange({ candidateCount: value, proConMinDifference });
          }}
          onValueCommitted={(value) => {
            onCommit({ candidateCount: value, proConMinDifference });
          }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] tabular-nums">
          {t.options.proConMinDifference}: {proConMinDifference} {t.options.pointsSuffix}
        </span>
        <Slider
          aria-label={t.options.proConMinDifference}
          min={PRO_CON_MIN_DIFFERENCE_MIN}
          max={PRO_CON_MIN_DIFFERENCE_MAX}
          step={PRO_CON_MIN_DIFFERENCE_STEP}
          value={proConMinDifference}
          disabled={disabled}
          onValueChange={(value) => {
            onLiveChange({ candidateCount, proConMinDifference: value });
          }}
          onValueCommitted={(value) => {
            onCommit({ candidateCount, proConMinDifference: value });
          }}
        />
      </div>
    </section>
  );
}
