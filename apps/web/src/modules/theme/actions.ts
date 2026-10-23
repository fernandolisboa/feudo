"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";

import { updateLayout, updateTheme } from "./service";
import { t } from "./strings";

export async function updateThemeAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const outcome = await updateTheme({ theme: formData.get("theme") });

  switch (outcome.status) {
    case "ok":
      revalidatePath("/", "layout");
      return { status: "success", message: t.preferences.saved };
    case "unauthenticated":
      return { status: "error", message: t.preferences.unauthenticated };
    case "invalid_theme":
      return { status: "error", message: t.preferences.invalid };
  }
}

export async function updateLayoutAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const outcome = await updateLayout({ layout: formData.get("layout") });

  switch (outcome.status) {
    case "ok":
      revalidatePath("/", "layout");
      return { status: "success", message: t.preferences.layoutSaved };
    case "unauthenticated":
      return { status: "error", message: t.preferences.unauthenticated };
    case "invalid_layout":
      return { status: "error", message: t.preferences.layoutInvalid };
  }
}
