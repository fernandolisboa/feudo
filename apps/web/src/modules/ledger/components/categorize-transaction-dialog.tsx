"use client";

import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
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
import { interpolate } from "@/lib/interpolate";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import type { TransactionDirection } from "@feudo/core";
import { categorizeTransactionAction, resetTransactionCategoryAction } from "../actions";
import { t } from "../strings";
import { RULE_PATTERN_MAX_LENGTH } from "../validation";

export type SubcategoryOptionGroup = {
  label: string;
  options: { value: string; label: string }[];
};

export type CategorizableRow = {
  id: string;
  description: string;
  amountLabel: string;
  type: TransactionDirection;
  subcategoryValue: string | null;
  isManual: boolean;
  suggestedPattern: string;
};

export function CategorizeTransactionDialog({
  transaction,
  groups,
}: {
  transaction: CategorizableRow;
  groups: SubcategoryOptionGroup[];
}) {
  const [open, setOpen] = useState(false);
  const [createRule, setCreateRule] = useState(false);
  const [state, formAction, isPending] = useActionState(
    categorizeTransactionAction,
    initialActionState,
  );
  const [resetState, resetAction, isResetting] = useActionState(
    resetTransactionCategoryAction,
    initialActionState,
  );
  const items = groups.flatMap((group) => group.options);
  const error =
    state.status === "error"
      ? state.message
      : resetState.status === "error"
        ? resetState.message
        : null;
  const selectId = `categorize-${transaction.id}`;
  const patternId = `categorize-pattern-${transaction.id}`;

  useCloseOnSuccess(state, setOpen);
  useCloseOnSuccess(resetState, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={interpolate(
              t.categorize.actionFor,
              "{description}",
              transaction.description,
            )}
          />
        }
      >
        {t.categorize.action}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="transactionId" value={transaction.id} />
          <input type="hidden" name="direction" value={transaction.type} />
          <DialogHeader>
            <DialogTitle>{t.categorize.title}</DialogTitle>
            <DialogDescription>
              {transaction.description} · {transaction.amountLabel}
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={selectId}>{t.categorize.label}</Label>
            <Select
              name="subcategory"
              items={items}
              defaultValue={transaction.subcategoryValue ?? undefined}
              required
            >
              <SelectTrigger id={selectId} className="w-full">
                <SelectValue placeholder={t.categorize.placeholder} />
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
              {t.categorize.createRule}
            </Label>
            {createRule ? (
              <div className="flex flex-col gap-1.5 pl-6">
                <Label htmlFor={patternId} className="sr-only">
                  {t.categorize.patternLabel}
                </Label>
                <Input
                  id={patternId}
                  name="pattern"
                  defaultValue={transaction.suggestedPattern}
                  maxLength={RULE_PATTERN_MAX_LENGTH}
                  required
                />
                <p className="text-muted-foreground text-xs">
                  {t.categorize.patternHint} {t.categorize.direction[transaction.type]}
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              {t.categorize.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.categorize.submit}
            </Button>
          </DialogFooter>
        </form>

        {transaction.isManual ? (
          <form action={resetAction} className="border-border border-t pt-3">
            <input type="hidden" name="transactionId" value={transaction.id} />
            <Button type="submit" variant="link" size="sm" disabled={isResetting} className="px-0">
              {t.categorize.resetAction}
            </Button>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
