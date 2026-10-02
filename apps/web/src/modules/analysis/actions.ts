"use server";

import { revalidatePath } from "next/cache";

import { requireHouseholdSession } from "@/modules/households";

import type { ActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";
import { getDb } from "@/platform/db/client";
import { ON_DEMAND_ANALYSES_PER_DAY, runOnDemandAnalysis } from "./service";
import { t } from "./strings";

export async function requestAnalysisAction(): Promise<ActionState> {
  const session = await requireHouseholdSession();
  const outcome = await runOnDemandAnalysis(session, getDb());
  switch (outcome.status) {
    case "ok":
      revalidatePath("/");
      revalidatePath("/reserva");
      return { status: "success", message: t.outcomes.ok };
    case "failed":
      revalidatePath("/");
      revalidatePath("/reserva");
      return { status: "error", message: t.outcomes.failed };
    case "quota_exhausted":
      return {
        status: "error",
        message: interpolate(t.outcomes.exhausted, "{limit}", String(ON_DEMAND_ANALYSES_PER_DAY)),
      };
    case "in_progress":
      return { status: "error", message: t.outcomes.inProgress };
    case "no_accounts":
      return { status: "error", message: t.outcomes.noAccounts };
    case "disabled":
      return { status: "error", message: t.outcomes.disabled };
  }
}
