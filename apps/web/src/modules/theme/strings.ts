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
      varanda: "Varanda",
      nitido: "Nítido",
      lamparina: "Lamparina",
      cofre: "Cofre",
    },
    themeHints: {
      caderno: "Paper and serif, calm",
      painel: "Neutral and compact",
      sala: "Airy and rounded",
      varanda: "Plants, tile blue and terracotta",
      nitido: "High contrast, larger text",
      lamparina: "Dark and cozy",
      cofre: "Dark and precise",
    },
    saved: "Theme updated.",
    invalid: "Choose one of the available themes.",
    unauthenticated: "Sign in to change your theme.",
    layoutLabel: "Layout",
    layoutDescription:
      "Where the menu sits on a computer. On a phone it always sits at the bottom.",
    layoutNames: {
      sidebar: "Side menu",
      topnav: "Top menu",
      dock: "Floating menu",
    },
    layoutHints: {
      sidebar: "Collapsible, on the left",
      topnav: "A bar across the top",
      dock: "Floats at the bottom, content centered",
    },
    layoutSaved: "Layout updated.",
    layoutInvalid: "Choose one of the available layouts.",
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
      varanda: "Varanda",
      nitido: "Nítido",
      lamparina: "Lamparina",
      cofre: "Cofre",
    },
    themeHints: {
      caderno: "Papel e serifa, sereno",
      painel: "Neutro e compacto",
      sala: "Arejado e arredondado",
      varanda: "Plantas, azulejo e terracota",
      nitido: "Alto contraste, letra maior",
      lamparina: "Escuro e aconchegante",
      cofre: "Escuro e preciso",
    },
    saved: "Tema atualizado.",
    invalid: "Escolha um dos temas disponíveis.",
    unauthenticated: "Entre para alterar seu tema.",
    layoutLabel: "Layout",
    layoutDescription: "Onde o menu fica no computador. No celular, ele fica sempre embaixo.",
    layoutNames: {
      sidebar: "Menu lateral",
      topnav: "Menu no topo",
      dock: "Menu flutuante",
    },
    layoutHints: {
      sidebar: "Recolhível, à esquerda",
      topnav: "Uma barra no alto da tela",
      dock: "Flutua embaixo, com o conteúdo centralizado",
    },
    layoutSaved: "Layout atualizado.",
    layoutInvalid: "Escolha um dos layouts disponíveis.",
  },
} satisfies typeof en;

const themeStrings = { en, ptBR };

export const t = themeStrings.ptBR;
