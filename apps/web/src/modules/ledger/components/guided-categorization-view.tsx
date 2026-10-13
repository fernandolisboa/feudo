"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Landmark, Lightbulb } from "lucide-react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { PageHeader } from "@/ui/page-header";
import { Progress } from "@/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { initialActionState } from "@/lib/action-state";
import { interpolate, interpolateAll } from "@/lib/interpolate";

import { categorizeTransactionAction, setTransferMarkAction } from "../actions";
import type { GuidedCategorizationProps, GuidedItemView } from "../guided-categorization";
import { t } from "../strings";
import { RULE_PATTERN_MAX_LENGTH, RULE_PATTERN_MIN_LENGTH } from "../validation";
import type { SubcategoryOptionGroup } from "./categorize-transaction-dialog";

function title(remaining: number, sinceLabel: string): string {
  if (remaining === 0) {
    return interpolate(t.guided.title.none, "{month}", sinceLabel);
  }
  if (remaining === 1) {
    return t.guided.title.one;
  }
  return interpolate(t.guided.title.many, "{count}", String(remaining));
}

function similarLine(count: number): string {
  return count === 1
    ? t.guided.similarOne
    : interpolate(t.guided.similarMany, "{count}", String(count));
}

function GuidedItem({
  item,
  groups,
  onSkip,
}: {
  item: GuidedItemView;
  groups: SubcategoryOptionGroup[];
  onSkip: () => void;
}) {
  const [createRule, setCreateRule] = useState(
    item.similarCount > 0 && item.pattern.length >= RULE_PATTERN_MIN_LENGTH,
  );
  const [state, formAction, isSaving] = useActionState(
    categorizeTransactionAction,
    initialActionState,
  );
  const [markState, markAction, isMarking] = useActionState(
    setTransferMarkAction,
    initialActionState,
  );
  const items = groups.flatMap((group) => group.options);
  const error =
    state.status === "error"
      ? state.message
      : markState.status === "error"
        ? markState.message
        : null;
  const selectId = `guided-category-${item.id}`;
  const patternId = `guided-pattern-${item.id}`;
  const suggestionId = `guided-suggestion-${item.id}`;

  return (
    <article className="border-border bg-card flex flex-col gap-5 rounded-lg border p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs tabular-nums">
          {item.dateLabel} · {item.accountLabel}
        </p>
        <h2 className="font-heading text-[22px] leading-tight break-words">{item.description}</h2>
        <p className="flex items-baseline gap-2">
          <span className="font-heading text-[26px] tabular-nums">{item.amountLabel}</span>
          <span className="text-muted-foreground text-[13px]">{t.guided[item.type]}</span>
        </p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="transactionId" value={item.id} />
        <input type="hidden" name="direction" value={item.type} />

        <div
          id={suggestionId}
          className="border-border bg-background flex gap-3 rounded-lg border px-3 py-2.5"
        >
          <Lightbulb aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-0.5 text-[13px]">
            {item.suggestion ? (
              <>
                <span className="font-medium">
                  {t.guided.suggestion.label}: {item.suggestion.label}
                </span>
                <span className="text-muted-foreground">{item.suggestion.reason}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{t.guided.suggestion.none}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={selectId}>{t.guided.categoryLabel}</Label>
          <Select name="subcategory" items={items} defaultValue={item.suggestion?.value} required>
            <SelectTrigger id={selectId} className="w-full" aria-describedby={suggestionId}>
              <SelectValue placeholder={t.guided.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="items-start gap-2 font-normal">
            <Checkbox
              name="createRule"
              checked={createRule}
              onCheckedChange={setCreateRule}
              className="mt-0.5"
            />
            {t.guided.createRule}
          </Label>
          {createRule ? (
            <div className="flex flex-col gap-1.5 pl-6">
              <Label htmlFor={patternId} className="sr-only">
                {t.guided.patternLabel}
              </Label>
              <Input
                id={patternId}
                name="pattern"
                defaultValue={item.pattern}
                maxLength={RULE_PATTERN_MAX_LENGTH}
                required
              />
            </div>
          ) : null}
          {item.similarCount > 0 ? (
            <p className="text-muted-foreground pl-6 text-xs">{similarLine(item.similarCount)}</p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={onSkip}>
            {t.guided.skip}
          </Button>
          <Button type="submit" disabled={isSaving} className="sm:ml-auto">
            {t.guided.save}
          </Button>
        </div>
      </form>

      <form action={markAction} className="border-border border-t pt-3">
        <input type="hidden" name="transactionId" value={item.id} />
        <input type="hidden" name="value" value="true" />
        <Button type="submit" variant="link" size="sm" disabled={isMarking} className="px-0">
          {t.guided.markTransfer}
        </Button>
      </form>
    </article>
  );
}

export function GuidedCategorizationView({
  sinceLabel,
  hasTransactions,
  items,
  categoryGroups,
}: GuidedCategorizationProps) {
  const [initialTotal] = useState(items.length);
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(() => new Set());

  const remaining = items.length;
  const total = Math.max(initialTotal, remaining);
  const done = total - remaining;
  const current = items.find((item) => !skipped.has(item.id));

  return (
    <>
      <PageHeader
        overline={interpolate(t.guided.overline, "{month}", sinceLabel)}
        title={title(remaining, sinceLabel)}
      />
      {!hasTransactions ? (
        <div className="flex flex-col items-start gap-3">
          <p className="font-heading text-[18px]">
            {interpolate(t.guided.empty, "{month}", sinceLabel)}
          </p>
          <Button render={<Link href="/conectar-banco" />}>
            <Landmark className="size-4" />
            {t.guided.connectAction}
          </Button>
        </div>
      ) : remaining === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="font-heading text-[18px]">
            {interpolate(t.guided.doneBody, "{month}", sinceLabel)}
          </p>
          <Button render={<Link href="/" />}>{t.guided.doneAction}</Button>
        </div>
      ) : (
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="text-muted-foreground text-[13px]">{t.guided.intro}</p>
          <Progress value={total > 0 ? Math.round((done / total) * 100) : 0}>
            <span className="text-muted-foreground text-xs tabular-nums">
              {interpolateAll(t.guided.progress, {
                done: String(done),
                total: String(total),
              })}
            </span>
          </Progress>
          {current ? (
            <GuidedItem
              key={current.id}
              item={current}
              groups={categoryGroups}
              onSkip={() => {
                setSkipped((previous) => new Set(previous).add(current.id));
              }}
            />
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="font-heading text-[18px]">
                {interpolate(t.guided.skippedAll, "{count}", String(remaining))}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSkipped(new Set());
                }}
              >
                {t.guided.restart}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
