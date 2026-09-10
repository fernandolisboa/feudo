const en = {
  overline: "Coming soon",
  title: "Transactions",
  body: "Your transactions will show up here once this page ships.",
};

const ptBR = {
  overline: "Em breve",
  title: "Transações",
  body: "Suas transações aparecerão aqui quando esta página chegar.",
} satisfies typeof en;

const transactionsPageStrings = { en, ptBR };

export const t = transactionsPageStrings.ptBR;
