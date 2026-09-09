import { redirect } from "next/navigation";

import { getCurrentSession } from "@/modules/auth";
import { OnboardingForm, resolveOnboardingRoute, t } from "@/modules/households";

export default async function OnboardingPage() {
  const session = await getCurrentSession();
  const redirectTarget = resolveOnboardingRoute(session);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="border-border bg-card w-full max-w-sm rounded-lg border p-6">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {t.onboarding.overline}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t.onboarding.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.onboarding.subtitle}</p>
        <div className="mt-6">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
