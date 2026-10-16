"use server";

import { revalidatePath } from "next/cache";

import {
  canManageHouseholdSettings,
  getViewerRole,
  householdScope,
  requireHouseholdSession,
} from "@/modules/households";

import type { ActionState } from "@/lib/action-state";
import { interpolate } from "@/lib/interpolate";
import { getDb } from "@/platform/db/client";
import { removeAiKey, saveAiSettings } from "./ai-settings";
import { readAiProviderName, readEncryptionKey } from "./env";
import { ANALYSES_PATH } from "./paths";
import { createAiProvider } from "./provider";
import { ON_DEMAND_ANALYSES_PER_DAY, runOnDemandAnalysis } from "./service";
import { t } from "./strings";
import { saveAiSettingsFormSchema } from "./validation";

function revalidateReadingPages(): void {
  for (const path of ["/", "/reserva", ANALYSES_PATH, "/bancos"]) {
    revalidatePath(path);
  }
}

function revalidateAiSettingsPages(): void {
  for (const path of ["/casa", ANALYSES_PATH, "/", "/reserva"]) {
    revalidatePath(path);
  }
}

export async function requestAnalysisAction(): Promise<ActionState> {
  const session = await requireHouseholdSession();
  const outcome = await runOnDemandAnalysis(session, getDb());
  switch (outcome.status) {
    case "ok":
      revalidateReadingPages();
      return { status: "success", message: t.outcomes.ok };
    case "failed":
      revalidateReadingPages();
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
    case "no_time":
      return { status: "error", message: t.outcomes.noTime };
  }
}

// Only owner and admin may change the household's key or model families; a
// key is verified against Anthropic before it is ever stored (saveAiSettings)
// and nothing here ever puts the key itself in the response, a log or an
// error message.
export async function saveAiSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = saveAiSettingsFormSchema.safeParse({
    apiKey: formData.get("apiKey"),
    monthlyFamily: formData.get("monthlyFamily"),
    onDemandFamily: formData.get("onDemandFamily"),
  });
  if (!parsed.success) {
    return { status: "error", message: t.aiSettings.outcomes.invalidInput };
  }

  const session = await requireHouseholdSession();
  const db = getDb();
  const viewerRole = await getViewerRole(session, db);
  if (!canManageHouseholdSettings(viewerRole)) {
    return { status: "error", message: t.aiSettings.outcomes.notAllowed };
  }

  const provider = createAiProvider(readAiProviderName());
  if (provider === null) {
    return { status: "error", message: t.aiSettings.outcomes.unavailable };
  }
  let encryptionKey: string;
  try {
    encryptionKey = readEncryptionKey();
  } catch {
    return { status: "error", message: t.aiSettings.outcomes.unavailable };
  }

  const outcome = await saveAiSettings(householdScope(session), db, provider, encryptionKey, {
    apiKey: parsed.data.apiKey ?? null,
    monthlyFamily: parsed.data.monthlyFamily,
    onDemandFamily: parsed.data.onDemandFamily,
    updatedByUserId: session.userId,
  });

  switch (outcome.status) {
    case "ok":
      revalidateAiSettingsPages();
      return { status: "success", message: t.aiSettings.outcomes.saved };
    case "invalid_key":
      return { status: "error", message: t.aiSettings.outcomes.invalidKey };
    case "unavailable":
      return { status: "error", message: t.aiSettings.outcomes.unavailable };
    case "failed":
      return { status: "error", message: t.aiSettings.outcomes.failed };
    case "rate_limited":
      return { status: "error", message: t.aiSettings.outcomes.rateLimited };
  }
}

export async function removeAiKeyAction(): Promise<ActionState> {
  const session = await requireHouseholdSession();
  const db = getDb();
  const viewerRole = await getViewerRole(session, db);
  if (!canManageHouseholdSettings(viewerRole)) {
    return { status: "error", message: t.aiSettings.outcomes.notAllowed };
  }

  const outcome = await removeAiKey(householdScope(session), db, session.userId);
  switch (outcome.status) {
    case "ok":
      revalidateAiSettingsPages();
      return { status: "success", message: t.aiSettings.outcomes.removed };
    case "failed":
      return { status: "error", message: t.aiSettings.outcomes.failed };
  }
}
