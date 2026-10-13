import { cookies } from "next/headers";

import { errorName } from "@/lib/error-name";
import type { HouseholdSession } from "@/modules/households";

import { getCategorizationNudgeProps } from "../guided-categorization";
import { CATEGORIZATION_NUDGE_HIDDEN_COOKIE } from "../nudge-cookie";
import { CategorizationNudgeNotice } from "./categorization-nudge-notice";

// Rendered by the signed-in layout outside every page's error boundary, so a
// failed read hides the notice instead of taking the whole shell down.
export async function CategorizationNudge({ session }: { session: HouseholdSession }) {
  const store = await cookies();
  if (store.get(CATEGORIZATION_NUDGE_HIDDEN_COOKIE)?.value === session.householdId) {
    return null;
  }
  const props = await getCategorizationNudgeProps(session).catch((error: unknown) => {
    console.error("categorization nudge read failed", errorName(error));
    return null;
  });
  return props ? <CategorizationNudgeNotice householdId={session.householdId} {...props} /> : null;
}
