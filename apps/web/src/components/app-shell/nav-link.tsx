"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
// Direct file import, not the module's index: see the matching note in
// sidebar-nav.tsx (this file is bundled for the client too).
import { t } from "@/modules/theme/strings";

import type { NavItem } from "./nav-items";

export function NavLink({ item, showLabel }: { item: NavItem; showLabel: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  if (item.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="app-shell-nav-link app-shell-nav-link-disabled" aria-disabled="true" />
          }
        >
          <item.icon className="size-4" aria-hidden="true" />
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
      className={cn("app-shell-nav-link", isActive && "app-shell-nav-link-active")}
    >
      <item.icon className="size-4" aria-hidden="true" />
      {showLabel ? <span>{item.label}</span> : null}
    </Link>
  );
}
