import { getDb } from "@/platform/db/client";
import { getCurrentSession } from "@/modules/auth";

import { setUserLayout, setUserTheme } from "./repository";
import { updateLayoutFormSchema, updateThemeFormSchema } from "./validation";

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

export type UpdateLayoutOutcome =
  { status: "ok" } | { status: "unauthenticated" } | { status: "invalid_layout" };

export async function updateLayout(input: unknown): Promise<UpdateLayoutOutcome> {
  const session = await getCurrentSession();
  if (!session) {
    return { status: "unauthenticated" };
  }

  const parsed = updateLayoutFormSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid_layout" };
  }

  await setUserLayout(getDb(), session.userId, parsed.data.layout);
  return { status: "ok" };
}
