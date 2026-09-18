"use client";

import type { ReactNode } from "react";

import { NavLink } from "./nav-link";
import type { NavItem } from "../nav-items";

export function TopNav({
  items,
  userMenu,
  householdSwitcher,
}: {
  items: NavItem[];
  userMenu: ReactNode;
  householdSwitcher: ReactNode;
}) {
  return (
    <nav className="app-shell-nav" data-shell="topnav">
      <span className="app-shell-wordmark">Feudo</span>
      <ul className="app-shell-nav-list-horizontal">
        {items.map((item) => (
          <li key={item.id}>
            <NavLink item={item} showLabel />
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        {householdSwitcher}
        {userMenu}
      </div>
    </nav>
  );
}
