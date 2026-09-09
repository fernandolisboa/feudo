import type { LucideIcon } from "lucide-react";
import { ArrowLeftRight, House, LayoutDashboard, Landmark, PiggyBank } from "lucide-react";

import { t } from "@/modules/theme";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  disabled: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: t.nav.overview, href: "/", icon: LayoutDashboard, disabled: false },
  {
    id: "transactions",
    label: t.nav.transactions,
    href: "/transacoes",
    icon: ArrowLeftRight,
    disabled: false,
  },
  { id: "reserve", label: t.nav.reserve, href: "/reserva", icon: PiggyBank, disabled: false },
  { id: "banks", label: t.nav.banks, href: "/bancos", icon: Landmark, disabled: true },
  { id: "household", label: t.nav.household, href: "/casa", icon: House, disabled: true },
];
