"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "./action-state";
import { updateTheme } from "./service";
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
