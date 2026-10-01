import type { ReactNode } from "react";

import type { ShellLayout } from "@/modules/theme";

import type { TourState } from "../tour-state";

import { MobileHeader } from "./mobile-header";
import { MobileTabBar } from "./mobile-tab-bar";
import { NAV_ITEMS } from "../nav-items";
import { SidebarNav } from "./sidebar-nav";
import { TopNav } from "./top-nav";
import { TourProvider } from "./tour-provider";
import { UserMenu } from "./user-menu";

export function AppShell({
  shell,
  sidebarCollapsed,
  userName,
  userEmail,
  householdSwitcher,
  tourState,
  children,
}: {
  shell: ShellLayout;
  sidebarCollapsed: boolean;
  userName: string;
  userEmail: string;
  householdSwitcher: ReactNode;
  tourState: TourState;
  children: ReactNode;
}) {
  const userMenu = <UserMenu name={userName} email={userEmail} />;

  return (
    <TourProvider initialState={tourState}>
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
    </TourProvider>
  );
}
