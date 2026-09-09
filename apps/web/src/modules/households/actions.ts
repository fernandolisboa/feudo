"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { getCurrentSession, type ActionState } from "@/modules/auth";

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
  const session = await getCurrentSession();
  const outcome = await createHousehold(parsed.data, session, getDb(), requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect("/");
    case "unauthenticated":
      return { status: "error", message: t.errors.unauthenticated };
    case "already_has_household":
      return { status: "error", message: t.errors.alreadyHasHousehold };
    case "failed":
      return { status: "error", message: t.errors.createFailed };
  }
}

export async function switchHouseholdAction(householdId: string): Promise<ActionState> {
  const parsed = switchHouseholdFormSchema.safeParse({ householdId });
  if (!parsed.success) {
    return { status: "error", message: t.errors.invalidInput };
  }

  const requestHeaders = await headers();
  const outcome = await switchHousehold(parsed.data.householdId, requestHeaders);

  switch (outcome.status) {
    case "ok":
      redirect("/");
    case "not_a_member":
      return { status: "error", message: t.errors.notAMember };
    case "failed":
      return { status: "error", message: t.errors.switchFailed };
  }
}
