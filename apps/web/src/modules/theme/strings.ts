const en = {
  preferences: {
    title: "Preferences",
    overline: "Settings",
    sectionError: {
      message: "Couldn't load this part right now. Check your connection and try again.",
      retry: "Try again",
    },
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
  preferences: {
    title: "Preferências",
    overline: "Configurações",
    sectionError: {
      message: "Não deu para carregar esta parte agora. Confira sua conexão e tente de novo.",
      retry: "Tentar de novo",
    },
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
