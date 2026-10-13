import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BookOpenText,
  House,
  LayoutDashboard,
  Landmark,
  PiggyBank,
} from "lucide-react";

import type { NavIconName } from "../nav-items";

export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  overview: LayoutDashboard,
  transactions: ArrowLeftRight,
  reserve: PiggyBank,
  banks: Landmark,
  analyses: BookOpenText,
  household: House,
};
