const en = {
  nav: {
    overview: "Overview",
    transactions: "Transactions",
    reserve: "Reserve",
    banks: "Banks",
    household: "Household",
    comingSoon: "Coming soon",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
  },
  userMenu: {
    preferences: "Preferences",
  },
};

const ptBR = {
  nav: {
    overview: "Visão geral",
    transactions: "Transações",
    reserve: "Reserva",
    banks: "Bancos",
    household: "Casa",
    comingSoon: "Em breve",
    collapseSidebar: "Recolher menu",
    expandSidebar: "Expandir menu",
  },
  userMenu: {
    preferences: "Preferências",
  },
} satisfies typeof en;

const appShellStrings = { en, ptBR };

export const t = appShellStrings.ptBR;
