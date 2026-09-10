import type { ReactNode } from "react";

import { getHouseholdSwitcherProps, HouseholdSwitcherSelect } from "@/modules/households";
import type { ShellLayout } from "@/modules/theme";

import { MobileHeader } from "./mobile-header";
import { MobileTabBar } from "./mobile-tab-bar";
import { NAV_ITEMS } from "./nav-items";
import { SidebarNav } from "./sidebar-nav";
import { TopNav } from "./top-nav";
import { UserMenu } from "./user-menu";

export async function AppShell({
  shell,
  sidebarCollapsed,
  userName,
  userEmail,
  householdId,
  children,
}: {
  shell: ShellLayout;
  sidebarCollapsed: boolean;
  userName: string;
  userEmail: string;
  householdId: string;
  children: ReactNode;
}) {
  const userMenu = <UserMenu name={userName} email={userEmail} />;
  const switcherProps = await getHouseholdSwitcherProps(householdId);
  const householdSwitcher = switcherProps ? <HouseholdSwitcherSelect {...switcherProps} /> : null;

  return (
    <div className="app-shell" data-shell={shell}>
      {shell === "sidebar" ? (
        <SidebarNav
          items={NAV_ITEMS}
          initialCollapsed={sidebarCollapsed}
          userMenu={userMenu}
          householdSwitcher={householdSwitcher}
        />
      ) : (
        <TopNav items={NAV_ITEMS} userMenu={userMenu} householdSwitcher={householdSwitcher} />
      )}

      <MobileHeader userMenu={userMenu} householdSwitcher={householdSwitcher} />

      <main className="app-shell-content">{children}</main>

      <MobileTabBar items={NAV_ITEMS} />
    </div>
  );
}
