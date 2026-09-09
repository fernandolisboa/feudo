import { ChevronsUpDown, House } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { t } from "@/modules/theme";

export function HouseholdSwitcherPlaceholder() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            // aria-disabled, not the native `disabled` attribute: a real
            // disabled button strips pointer events and focus, which would
            // make this tooltip unreachable by mouse or keyboard.
            className="cursor-not-allowed opacity-50"
            aria-disabled="true"
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
