"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";

import { type ActionState } from "./action-state";
import { createHousehold, switchHousehold } from "./service";
import { t } from "./strings";
import { createHouseholdFormSchema, switchHouseholdFormSchema } from "./validation";

export async function createHouseholdAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createHouseholdFormSchema.safeParse({
    name: formData.get("name"),
    timeZone: formData.get("timeZone") || undefined,
    reserveMultiple: formData.get("reserveMultiple") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const requestHeaders = await headers();
  const outcome = await createHousehold(parsed.data, getDb(), requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect("/");
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "failed":
      return { status: "error", message: t.errors.createFailed };
  }
}

export async function switchHouseholdAction(householdId: string): Promise<void> {
  const parsed = switchHouseholdFormSchema.safeParse({ householdId });
  if (!parsed.success) {
    return;
  }

  const requestHeaders = await headers();
  await switchHousehold(parsed.data.householdId, requestHeaders);
  redirect("/");
}
