import { headers } from "next/headers";
import { getAuth } from "./auth";

export type CurrentSession = {
  userId: string;
  name: string;
  email: string;
  householdId: string | null;
};

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }
  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    householdId: session.session.activeOrganizationId ?? null,
  };
}
