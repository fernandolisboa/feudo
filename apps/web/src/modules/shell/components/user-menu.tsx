import Link from "next/link";
import { CircleHelp, Settings, User } from "lucide-react";

import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { SignOutMenuItem } from "@/modules/auth";
import { GUIDE_PATH } from "@/modules/guide";

import { t } from "../strings";
import { TourMenuItem } from "./tour-menu-item";

export function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={name} data-tour="overview.help" />}
      >
        <User className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate">{name}</span>
            <span className="text-muted-foreground block truncate text-xs font-normal">
              {email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/preferencias" />}>
          <Settings className="size-4" />
          {t.userMenu.preferences}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={GUIDE_PATH} />}>
          <CircleHelp className="size-4" />
          {t.userMenu.guide}
        </DropdownMenuItem>
        <TourMenuItem />
        <DropdownMenuSeparator />
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
