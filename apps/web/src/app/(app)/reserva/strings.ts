const en = {
  overline: "Coming soon",
  title: "Reserve",
  body: "Your emergency reserve will show up here once this page ships.",
};

const ptBR = {
  overline: "Em breve",
  title: "Reserva",
  body: "Sua reserva de emergência aparecerá aqui quando esta página chegar.",
} satisfies typeof en;

const reservePageStrings = { en, ptBR };

export const t = reservePageStrings.ptBR;
