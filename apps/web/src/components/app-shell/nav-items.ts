import { t } from "./strings";

export type NavIconName = "overview" | "transactions" | "reserve" | "banks" | "household";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
  disabled: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: t.nav.overview, href: "/", icon: "overview", disabled: false },
  {
    id: "transactions",
    label: t.nav.transactions,
    href: "/transacoes",
    icon: "transactions",
    disabled: false,
  },
  { id: "reserve", label: t.nav.reserve, href: "/reserva", icon: "reserve", disabled: false },
  { id: "banks", label: t.nav.banks, href: "/bancos", icon: "banks", disabled: true },
  { id: "household", label: t.nav.household, href: "/casa", icon: "household", disabled: true },
];
