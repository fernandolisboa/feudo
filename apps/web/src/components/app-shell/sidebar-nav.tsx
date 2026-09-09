"use client";

import { useState, useTransition } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
// Direct file import, not the module's index: this file is bundled for the
// client, and the theme module's index also re-exports service.ts, which
// depends on "@/modules/auth" and, through it, "next/headers".
import { t } from "@/modules/theme/strings";

import { setSidebarCollapsedAction } from "./actions";
import { NavLink } from "./nav-link";
import type { NavItem } from "./nav-items";

export function SidebarNav({
  items,
  initialCollapsed,
  userMenu,
  householdSwitcher,
}: {
  items: NavItem[];
  initialCollapsed: boolean;
  userMenu: ReactNode;
  householdSwitcher: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [, startTransition] = useTransition();

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    startTransition(() => {
      void setSidebarCollapsedAction(next);
    });
  }

  return (
    <nav className="app-shell-nav" data-shell="sidebar" data-collapsed={collapsed}>
      <div className="app-shell-nav-brand">
        <span className="app-shell-wordmark">Feudo</span>
      </div>

      <ul className="app-shell-nav-list">
        {items.map((item) => (
          <li key={item.id}>
            <NavLink item={item} showLabel={!collapsed} />
          </li>
        ))}
      </ul>

      <div className="app-shell-nav-foot">
        <div className="app-shell-household-slot">{householdSwitcher}</div>
        <div className="flex items-center justify-between gap-2">
          {userMenu}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            aria-label={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}
