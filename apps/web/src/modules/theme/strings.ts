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
    openMenu: "Open menu",
  },
  householdSwitcher: {
    placeholder: "Your household",
    comingSoon: "Available once households ship",
  },
  userMenu: {
    preferences: "Preferences",
    signOut: "Sign out",
  },
  placeholder: {
    overline: "Coming soon",
    transactionsBody: "Your transactions will show up here once this page ships.",
    reserveBody: "Your emergency reserve will show up here once this page ships.",
  },
  preferences: {
    title: "Preferences",
    overline: "Settings",
    themeLabel: "Theme",
    themeDescription: "Choose how Feudo looks for you. Only you see this change.",
    themeNames: {
      caderno: "Caderno",
      painel: "Painel",
      sala: "Sala",
    },
    saved: "Theme updated.",
    invalid: "Choose one of the available themes.",
    unauthenticated: "Sign in to change your theme.",
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
    openMenu: "Abrir menu",
  },
  householdSwitcher: {
    placeholder: "Sua casa",
    comingSoon: "Disponível quando as casas chegarem",
  },
  userMenu: {
    preferences: "Preferências",
    signOut: "Sair",
  },
  placeholder: {
    overline: "Em breve",
    transactionsBody: "Suas transações aparecerão aqui quando esta página chegar.",
    reserveBody: "Sua reserva de emergência aparecerá aqui quando esta página chegar.",
  },
  preferences: {
    title: "Preferências",
    overline: "Configurações",
    themeLabel: "Tema",
    themeDescription: "Escolha a aparência do Feudo para você. Só você vê essa mudança.",
    themeNames: {
      caderno: "Caderno",
      painel: "Painel",
      sala: "Sala",
    },
    saved: "Tema atualizado.",
    invalid: "Escolha um dos temas disponíveis.",
    unauthenticated: "Entre para alterar seu tema.",
  },
} satisfies typeof en;

const themeStrings = { en, ptBR };

export const t = themeStrings.ptBR;
