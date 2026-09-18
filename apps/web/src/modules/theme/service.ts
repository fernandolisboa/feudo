import { getDb } from "@/platform/db/client";
import { getCurrentSession } from "@/modules/auth";

import { setUserTheme } from "./repository";
import { updateThemeFormSchema } from "./validation";

export type UpdateThemeOutcome =
  { status: "ok" } | { status: "unauthenticated" } | { status: "invalid_theme" };

export async function updateTheme(input: unknown): Promise<UpdateThemeOutcome> {
  const session = await getCurrentSession();
  if (!session) {
    return { status: "unauthenticated" };
  }

  const parsed = updateThemeFormSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid_theme" };
  }

  await setUserTheme(getDb(), session.userId, parsed.data.theme);
  return { status: "ok" };
}
