import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { readSidebarCollapsed } from "@/components/app-shell/sidebar-cookie";
import { requireHouseholdSession } from "@/modules/households";
import { resolveTheme, shellLayoutFor } from "@/modules/theme";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { name, email, theme, householdId } = await requireHouseholdSession();

  const shell = shellLayoutFor(resolveTheme(theme));
  const sidebarCollapsed = shell === "sidebar" ? await readSidebarCollapsed() : false;

  return (
    <AppShell
      shell={shell}
      sidebarCollapsed={sidebarCollapsed}
      userName={name}
      userEmail={email}
      householdId={householdId}
    >
      {children}
    </AppShell>
  );
}
