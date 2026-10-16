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
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";
import { useActionInTransition } from "@/lib/use-action-in-transition";

import { removeAiKeyAction, saveAiSettingsAction } from "../actions";
import { AI_FAMILIES } from "../ai-client";
import type { AiSettingsSectionProps } from "../page-props";
import { t } from "../strings";

const FAMILY_ITEMS = AI_FAMILIES.map((family) => ({
  value: family,
  label: t.aiSettings.familyNames[family],
}));

function CurrentKeyLine({ hasKey, apiKeyLast4 }: { hasKey: boolean; apiKeyLast4: string | null }) {
  return (
    <p className="text-sm">
      {hasKey && apiKeyLast4 !== null
        ? interpolate(t.aiSettings.currentKey, "{last4}", apiKeyLast4)
        : t.aiSettings.noKey}
    </p>
  );
}

function RemoveKeyDialog() {
  const [open, setOpen] = useState(false);
  const { errorMessage, isPending, run } = useActionInTransition(t.aiSettings.outcomes.failed);
  const copy = t.aiSettings.removeDialog;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        {t.aiSettings.removeAction}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
            }}
          >
            {copy.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              run(async () => {
                const result = await removeAiKeyAction();
                if (result.status === "success") {
                  setOpen(false);
                }
                return result;
              });
            }}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FamilySelect({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <Select name={name} items={FAMILY_ITEMS} defaultValue={defaultValue}>
      <SelectTrigger id={id} className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FAMILY_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Every member sees the current key state and families (read below); only
// owner/admin get the form that can change them (CLAUDE.md: "the household
// brings its own Anthropic API key"). The key itself never comes back from
// the server (page-props only ever reads its last 4 characters), so there is
// nothing to prefill here: a blank field submitted means "keep the current
// key" (validation.ts).
export function AiSettingsSection({
  canManage,
  hasKey,
  apiKeyLast4,
  monthlyFamily,
  onDemandFamily,
}: AiSettingsSectionProps) {
  const [state, formAction, isPending] = useActionState(saveAiSettingsAction, initialActionState);

  if (!canManage) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground max-w-prose text-sm">{t.aiSettings.description}</p>
        <CurrentKeyLine hasKey={hasKey} apiKeyLast4={apiKeyLast4} />
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt>{t.aiSettings.monthlyFamilyLabel}</dt>
            <dd>{t.aiSettings.familyNames[monthlyFamily]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>{t.aiSettings.onDemandFamilyLabel}</dt>
            <dd>{t.aiSettings.familyNames[onDemandFamily]}</dd>
          </div>
        </dl>
        <p className="text-muted-foreground text-xs">{t.aiSettings.viewerNote}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-prose flex-col gap-4">
      <p className="text-muted-foreground text-sm">{t.aiSettings.description}</p>

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

      <div className="flex flex-col gap-1.5">
        <CurrentKeyLine hasKey={hasKey} apiKeyLast4={apiKeyLast4} />
        <Label htmlFor="ai-settings-key">{t.aiSettings.keyLabel}</Label>
        <Input
          id="ai-settings-key"
          name="apiKey"
          type="password"
          autoComplete="off"
          placeholder={t.aiSettings.keyPlaceholder}
        />
        <p className="text-muted-foreground text-xs">{t.aiSettings.keyHelp}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ai-settings-monthly-family">{t.aiSettings.monthlyFamilyLabel}</Label>
        <FamilySelect
          id="ai-settings-monthly-family"
          name="monthlyFamily"
          defaultValue={monthlyFamily}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ai-settings-on-demand-family">{t.aiSettings.onDemandFamilyLabel}</Label>
        <FamilySelect
          id="ai-settings-on-demand-family"
          name="onDemandFamily"
          defaultValue={onDemandFamily}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {t.aiSettings.save}
        </Button>
        {hasKey ? <RemoveKeyDialog /> : null}
      </div>
    </form>
  );
}
