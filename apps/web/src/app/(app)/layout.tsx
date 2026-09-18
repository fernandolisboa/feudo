import type { ReactNode } from "react";

import {
  getHouseholdSwitcherProps,
  HouseholdSwitcherSelect,
  requireHouseholdSession,
} from "@/modules/households";
import { AppShell, readSidebarCollapsed } from "@/modules/shell";
import { resolveTheme, shellLayoutFor } from "@/modules/theme";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { name, email, theme, householdId } = await requireHouseholdSession();

  const shell = shellLayoutFor(resolveTheme(theme));
  const sidebarCollapsed = shell === "sidebar" ? await readSidebarCollapsed() : false;
  const switcherProps = await getHouseholdSwitcherProps(householdId);
  const householdSwitcher = switcherProps ? <HouseholdSwitcherSelect {...switcherProps} /> : null;

  return (
    <AppShell
      shell={shell}
      sidebarCollapsed={sidebarCollapsed}
      userName={name}
      userEmail={email}
      householdSwitcher={householdSwitcher}
    >
      {children}
    </AppShell>
  );
}
