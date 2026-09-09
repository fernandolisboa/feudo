import { cookies } from "next/headers";

const SIDEBAR_COLLAPSED_COOKIE = "sidebar-collapsed";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function readSidebarCollapsed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "1";
}

export async function writeSidebarCollapsed(collapsed: boolean): Promise<void> {
  const store = await cookies();
  store.set(SIDEBAR_COLLAPSED_COOKIE, collapsed ? "1" : "0", {
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: "lax",
  });
}
