"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { cn } from "@/lib/utils";

import { NAV_ICONS } from "./nav-icons";
import type { NavItem } from "../nav-items";
import { t } from "../strings";

export function NavLink({ item, showLabel }: { item: NavItem; showLabel: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = NAV_ICONS[item.icon];

  if (item.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className="app-shell-nav-link app-shell-nav-link-disabled"
              aria-disabled="true"
              aria-label={showLabel ? undefined : item.label}
              tabIndex={0}
            />
          }
        >
          <Icon className="size-4" aria-hidden="true" />
          {showLabel ? <span>{item.label}</span> : null}
        </TooltipTrigger>
        <TooltipContent>{t.nav.comingSoon}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      aria-label={showLabel ? undefined : item.label}
      className={cn("app-shell-nav-link", isActive && "app-shell-nav-link-active")}
    >
      <Icon className="size-4" aria-hidden="true" />
      {showLabel ? <span>{item.label}</span> : null}
    </Link>
  );
}
