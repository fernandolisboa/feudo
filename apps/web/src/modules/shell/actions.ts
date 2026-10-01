"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";

import {
  recordTourOutcome,
  resetTours,
  updateTourAutoStart,
  type TourWriteOutcome,
} from "./service";
import { t } from "./strings";

function toActionState(outcome: TourWriteOutcome, successMessage: string): ActionState {
  switch (outcome.status) {
    case "ok":
      return { status: "success", message: successMessage };
    case "unauthenticated":
      return { status: "error", message: t.preferences.unauthenticated };
    case "invalid":
      return { status: "error", message: t.preferences.failed };
  }
}

export async function recordTourOutcomeAction(input: unknown): Promise<ActionState> {
  return toActionState(await recordTourOutcome(input), "");
}

export async function updateTourAutoStartAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const autoStart = formData.get("autoStart");
  const outcome = await updateTourAutoStart({ autoStart });
  if (outcome.status === "ok") {
    revalidatePath("/", "layout");
  }
  return toActionState(
    outcome,
    autoStart === "on" ? t.preferences.autoStartOn : t.preferences.autoStartOff,
  );
}

export async function resetToursAction(): Promise<ActionState> {
  const outcome = await resetTours();
  if (outcome.status === "ok") {
    revalidatePath("/", "layout");
  }
  return toActionState(outcome, t.preferences.resetDone);
}
