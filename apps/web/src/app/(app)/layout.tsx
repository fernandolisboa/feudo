import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { readSidebarCollapsed } from "@/components/app-shell/sidebar-cookie";
import { getCurrentSession, type CurrentSession } from "@/modules/auth";
import { resolveAppRoute } from "@/modules/households";
import { resolveTheme, shellLayoutFor } from "@/modules/theme";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  const redirectTarget = resolveAppRoute(session);
  if (redirectTarget) {
    redirect(redirectTarget);
  }
  // resolveAppRoute returns null only when session is non-null (see
  // modules/households/routing.ts) — TypeScript cannot express that
  // invariant across the two functions, so it is asserted here once.
  const { name, email, theme } = session as CurrentSession;

  const shell = shellLayoutFor(resolveTheme(theme));
  const sidebarCollapsed = shell === "sidebar" ? await readSidebarCollapsed() : false;

  return (
    <AppShell shell={shell} sidebarCollapsed={sidebarCollapsed} userName={name} userEmail={email}>
      {children}
    </AppShell>
  );
}
