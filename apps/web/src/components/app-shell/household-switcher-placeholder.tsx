import { ChevronsUpDown, House } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { t } from "@/modules/theme";

export function HouseholdSwitcherPlaceholder({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            className={className}
            disabled
            aria-label={t.householdSwitcher.placeholder}
          />
        }
      >
        <House className="size-4" />
        <span data-slot="household-switcher-label">{t.householdSwitcher.placeholder}</span>
        <ChevronsUpDown className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{t.householdSwitcher.comingSoon}</TooltipContent>
    </Tooltip>
  );
}
