"use client";

import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Switch } from "@/ui/switch";
import { initialActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import { updateReserveMarkAction } from "../actions";
import type { InstitutionOption, ReserveMarkEdit } from "../page-props";
import { t } from "../strings";

const LIQUIDITY_ITEMS = (["daily", "not_daily", "unknown"] as const).map((value) => ({
  value,
  label: t.markDialog.liquidityOptions[value],
}));

export function ReserveMarkDialog({
  accountId,
  accountName,
  edit,
  institutionOptions,
}: {
  accountId: string;
  accountName: string;
  edit: ReserveMarkEdit;
  institutionOptions: InstitutionOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isReserve, setIsReserve] = useState(edit.isReserve);
  const [state, formAction, isPending] = useActionState(
    updateReserveMarkAction,
    initialActionState,
  );
  const institutionItems = [
    {
      value: "auto",
      label: edit.automaticInstitutionName
        ? interpolate(t.markDialog.institutionAuto, "{institution}", edit.automaticInstitutionName)
        : t.markDialog.institutionAutoUnknown,
    },
    ...institutionOptions,
  ];
  const switchId = `reserve-mark-${accountId}`;

  useCloseOnSuccess(state, setOpen);

  function handleOpenChange(next: boolean) {
    if (next) {
      setIsReserve(edit.isReserve);
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label={interpolate(t.positions.adjustFor, "{account}", accountName)}
          />
        }
      >
        {t.positions.adjust}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="accountId" value={accountId} />
          <input type="hidden" name="isReserve" value={isReserve ? "true" : "false"} />
          {edit.asksLiquidity ? null : (
            <input type="hidden" name="liquidity" value={edit.liquidity} />
          )}
          {edit.asksInstitution ? null : (
            <input type="hidden" name="institutionId" value={edit.institutionChoice} />
          )}
          <DialogHeader>
            <DialogTitle>{interpolate(t.markDialog.title, "{account}", accountName)}</DialogTitle>
            <DialogDescription>{t.markDialog.description}</DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center gap-3">
            <Switch id={switchId} checked={isReserve} onCheckedChange={setIsReserve} />
            <Label htmlFor={switchId}>{t.markDialog.reserveLabel}</Label>
          </div>

          {edit.asksLiquidity ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${switchId}-liquidity`}>{t.markDialog.liquidityLabel}</Label>
              <Select name="liquidity" items={LIQUIDITY_ITEMS} defaultValue={edit.liquidity}>
                <SelectTrigger id={`${switchId}-liquidity`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIQUIDITY_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {edit.asksInstitution ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${switchId}-institution`}>{t.markDialog.institutionLabel}</Label>
              <Select
                name="institutionId"
                items={institutionItems}
                defaultValue={edit.institutionChoice}
              >
                <SelectTrigger id={`${switchId}-institution`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {institutionItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              {t.markDialog.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.markDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
