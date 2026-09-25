"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { initialActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";

import { acceptConsentAction, connectProviderAction, type AcceptConsentState } from "../actions";
import { CONSENT_SCOPE_VERSION } from "../consent-text";
import { MEU_PLUGGY_URL, PLUGGY_DASHBOARD_URL, t } from "../strings";

type Step =
  { kind: "consent" } | { kind: "guide"; consentId: string } | { kind: "form"; consentId: string };

const initialConsentState: AcceptConsentState = initialActionState;

function ConsentStep({ onAccepted }: { onAccepted: (consentId: string) => void }) {
  const [state, formAction, isPending] = useActionState(acceptConsentAction, initialConsentState);

  useEffect(() => {
    if (state.status === "accepted") {
      onAccepted(state.consentId);
    }
  }, [state, onAccepted]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <p className="page-header-overline">{t.consent.overline}</p>
        <h1 className="font-heading text-[22px]">{t.consent.title}</h1>
      </div>

      <div className="flex flex-col gap-3 text-sm leading-relaxed">
        {t.consent.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p className="text-muted-foreground text-xs">
          {interpolate(t.consent.version, "{version}", CONSENT_SCOPE_VERSION)}
        </p>
      </div>

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Label className="flex items-start gap-2 text-sm font-normal">
        <Checkbox name="accepted" required className="mt-0.5" />
        <span>{t.consent.checkbox}</span>
      </Label>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {t.consent.continue}
        </Button>
      </div>
    </form>
  );
}

function GuideStep({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="page-header-overline">{t.guide.overline}</p>
        <h1 className="font-heading text-[22px]">{t.guide.title}</h1>
      </div>
      <p className="text-sm leading-relaxed">{t.guide.intro}</p>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
        {t.guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          render={<Link href={MEU_PLUGGY_URL} target="_blank" rel="noopener noreferrer" />}
        >
          {t.guide.link}
          <ExternalLink className="size-4" />
        </Button>
        <Button
          variant="outline"
          render={<Link href={PLUGGY_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" />}
        >
          {t.guide.dashboardLink}
          <ExternalLink className="size-4" />
        </Button>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          {t.guide.back}
        </Button>
        <Button type="button" onClick={onContinue}>
          {t.guide.continue}
        </Button>
      </div>
    </div>
  );
}

function CredentialsStep({ consentId, onBack }: { consentId: string; onBack: () => void }) {
  const [state, formAction, isPending] = useActionState(connectProviderAction, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="consentId" value={consentId} />
      <div>
        <p className="page-header-overline">{t.form.overline}</p>
        <h1 className="font-heading text-[22px]">{t.form.title}</h1>
      </div>
      <p className="text-sm leading-relaxed">{t.form.intro}</p>

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientId">{t.form.clientIdLabel}</Label>
        <Input id="clientId" name="clientId" autoComplete="off" spellCheck={false} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientSecret">{t.form.clientSecretLabel}</Label>
        <Input
          id="clientSecret"
          name="clientSecret"
          type="password"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="providerItemId">{t.form.itemIdLabel}</Label>
        <Input
          id="providerItemId"
          name="providerItemId"
          autoComplete="off"
          spellCheck={false}
          placeholder="00000000-0000-0000-0000-000000000000"
          required
        />
        <p className="text-muted-foreground text-xs">{t.form.itemIdHelp}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="institutionName">{t.form.institutionNameLabel}</Label>
        <Input id="institutionName" name="institutionName" autoComplete="off" maxLength={80} />
        <p className="text-muted-foreground text-xs">{t.form.institutionNameHelp}</p>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isPending}>
          {t.form.back}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? t.form.submitting : t.form.submit}
        </Button>
      </div>
    </form>
  );
}

export function ConnectBankWizard() {
  const [step, setStep] = useState<Step>({ kind: "consent" });

  switch (step.kind) {
    case "consent":
      return (
        <ConsentStep
          onAccepted={(consentId) => {
            setStep({ kind: "guide", consentId });
          }}
        />
      );
    case "guide":
      return (
        <GuideStep
          onBack={() => {
            setStep({ kind: "consent" });
          }}
          onContinue={() => {
            setStep({ kind: "form", consentId: step.consentId });
          }}
        />
      );
    case "form":
      return (
        <CredentialsStep
          consentId={step.consentId}
          onBack={() => {
            setStep({ kind: "guide", consentId: step.consentId });
          }}
        />
      );
  }
}
