import type { ReactNode } from "react";

import {
  getHouseholdSwitcherProps,
  HouseholdSwitcherSelect,
  requireHouseholdSession,
} from "@/modules/households";
import { AppErrorBoundary, AppShell, getTourState, readSidebarCollapsed } from "@/modules/shell";
import { resolveTheme, shellLayoutFor } from "@/modules/theme";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireHouseholdSession();
  const { name, email, theme, householdId } = session;

  const shell = shellLayoutFor(resolveTheme(theme));
  const sidebarCollapsed = shell === "sidebar" ? await readSidebarCollapsed() : false;
  const [switcherProps, tourState] = await Promise.all([
    getHouseholdSwitcherProps(householdId),
    getTourState(session),
  ]);
  const householdSwitcher = switcherProps ? <HouseholdSwitcherSelect {...switcherProps} /> : null;

  return (
    <AppShell
      shell={shell}
      sidebarCollapsed={sidebarCollapsed}
      userName={name}
      userEmail={email}
      householdSwitcher={householdSwitcher}
      tourState={tourState}
    >
      <AppErrorBoundary>{children}</AppErrorBoundary>
    </AppShell>
  );
}
