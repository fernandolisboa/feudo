"use client";

import type { ReactNode } from "react";

import { NavLink } from "./nav-link";
import type { NavItem } from "../nav-items";

export function DockNav({
  items,
  userMenu,
  householdSwitcher,
}: {
  items: NavItem[];
  userMenu: ReactNode;
  householdSwitcher: ReactNode;
}) {
  return (
    <>
      <header className="app-shell-dock-header">
        <span className="app-shell-wordmark">Feudo</span>
        <div className="flex items-center gap-2">
          {householdSwitcher}
          {userMenu}
        </div>
      </header>
      <nav className="app-shell-nav" data-shell="dock">
        <ul className="app-shell-dock-list" data-tour="overview.nav">
          {items.map((item) => (
            <li key={item.id}>
              <NavLink item={item} showLabel />
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
