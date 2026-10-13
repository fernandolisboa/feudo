import { t } from "./strings";

export type NavIconName =
  "overview" | "transactions" | "reserve" | "banks" | "analyses" | "household";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
  disabled: boolean;
  desktopOnly?: boolean;
  tourTarget?: string;
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
  { id: "banks", label: t.nav.banks, href: "/bancos", icon: "banks", disabled: false },
  {
    id: "analyses",
    label: t.nav.analyses,
    href: "/analises",
    icon: "analyses",
    disabled: false,
    desktopOnly: true,
  },
  {
    id: "household",
    label: t.nav.household,
    href: "/casa",
    icon: "household",
    disabled: false,
    tourTarget: "overview.household",
  },
];
