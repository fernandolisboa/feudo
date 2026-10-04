import type { ReactNode } from "react";

import {
  getHouseholdSwitcherProps,
  HouseholdSwitcherSelect,
  requireHouseholdSession,
} from "@/modules/households";
import {
  AppErrorBoundary,
  AppShell,
  getOfflineNoticeProps,
  getTourState,
  readSidebarCollapsed,
} from "@/modules/shell";
import { resolveTheme, shellLayoutFor } from "@/modules/theme";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireHouseholdSession();
  const { name, email, theme, householdId } = session;

  const shell = shellLayoutFor(resolveTheme(theme));
  const sidebarCollapsed = shell === "sidebar" ? await readSidebarCollapsed() : false;
  const [switcherProps, tourState, offline] = await Promise.all([
    getHouseholdSwitcherProps(householdId),
    getTourState(session),
    getOfflineNoticeProps(session, new Date()),
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
      offline={offline}
    >
      {/* Switching household keeps the URL, so the key is what clears a failed page. */}
      <AppErrorBoundary key={householdId}>{children}</AppErrorBoundary>
    </AppShell>
  );
}
