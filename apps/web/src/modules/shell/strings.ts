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
  comingSoon: {
    reserve: {
      overline: "Coming soon",
      title: "Reserve",
      body: "Your emergency reserve will show up here once this page ships.",
    },
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
  comingSoon: {
    reserve: {
      overline: "Em breve",
      title: "Reserva",
      body: "Sua reserva de emergência aparecerá aqui quando esta página chegar.",
    },
  },
} satisfies typeof en;

const appShellStrings = { en, ptBR };

export const t = appShellStrings.ptBR;
