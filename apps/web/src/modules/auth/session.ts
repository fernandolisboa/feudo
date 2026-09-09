import { headers } from "next/headers";
import { getAuth } from "./auth";

export async function getCurrentSession() {
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}
