import type { ReactNode } from "react";

export function MobileHeader({
  userMenu,
  householdSwitcher,
}: {
  userMenu: ReactNode;
  householdSwitcher: ReactNode;
}) {
  return (
    <header className="app-shell-mobile-header">
      <span className="app-shell-wordmark">Feudo</span>
      <div className="flex items-center gap-2">
        {householdSwitcher}
        {userMenu}
      </div>
    </header>
  );
}
