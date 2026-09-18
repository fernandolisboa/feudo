"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { NAV_ICONS } from "./nav-icons";
import type { NavItem } from "../nav-items";

export function MobileTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="app-shell-tabbar">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = NAV_ICONS[item.icon];

        if (item.disabled) {
          return (
            <span
              key={item.id}
              className="app-shell-tab app-shell-tab-disabled"
              aria-disabled="true"
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{item.label}</span>
            </span>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn("app-shell-tab", isActive && "app-shell-tab-active")}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
