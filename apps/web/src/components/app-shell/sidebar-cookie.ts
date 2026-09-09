import { cookies } from "next/headers";

import { SIDEBAR_COLLAPSED_COOKIE } from "./sidebar-cookie-name";

export async function readSidebarCollapsed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "1";
}
