import type { ReactNode } from "react";

import type { ShellLayout } from "@/modules/theme";

import type { OfflineNoticeProps } from "../offline-notice-props";
import type { TourState } from "../tour-state";

import { DockNav } from "./dock-nav";
import { MobileHeader } from "./mobile-header";
import { MobileTabBar } from "./mobile-tab-bar";
import { NAV_ITEMS } from "../nav-items";
import { OfflineNotice } from "./offline-notice";
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
  offline,
  notice,
  children,
}: {
  shell: ShellLayout;
  sidebarCollapsed: boolean;
  userName: string;
  userEmail: string;
  householdSwitcher: ReactNode;
  tourState: TourState;
  offline: OfflineNoticeProps;
  notice?: ReactNode;
  children: ReactNode;
}) {
  const userMenu = <UserMenu name={userName} email={userEmail} />;

  function renderNav(): ReactNode {
    switch (shell) {
      case "sidebar":
        return (
          <SidebarNav
            items={NAV_ITEMS}
            initialCollapsed={sidebarCollapsed}
            userMenu={userMenu}
            householdSwitcher={householdSwitcher}
          />
        );
      case "topnav":
        return (
          <TopNav items={NAV_ITEMS} userMenu={userMenu} householdSwitcher={householdSwitcher} />
        );
      case "dock":
        return (
          <DockNav items={NAV_ITEMS} userMenu={userMenu} householdSwitcher={householdSwitcher} />
        );
    }
  }

  return (
    <TourProvider initialState={tourState}>
      <div className="app-shell" data-shell={shell}>
        {renderNav()}

        <MobileHeader userMenu={userMenu} householdSwitcher={householdSwitcher} />

        <main className="app-shell-content">
          <OfflineNotice {...offline} />
          {notice}
          {children}
        </main>

        <MobileTabBar items={NAV_ITEMS} />
      </div>
    </TourProvider>
  );
}
