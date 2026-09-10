import Link from "next/link";
import { Settings, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from "@/modules/theme";

import { SignOutMenuItem } from "./sign-out-menu-item";

export function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={name} />}>
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
        <DropdownMenuSeparator />
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
