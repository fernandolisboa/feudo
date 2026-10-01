const en = {
  overline: "Reserve",
  headline: {
    target: "Your target is {amount}.",
    estimate: "Your estimated target is {amount}.",
    noAccounts: "Connect a bank to see the household's reserve target.",
    noHistory: "Categorize at least one month of spending to see the reserve target.",
  },
  multipleSelect: {
    label: "Reserve multiple",
  },
  tiles: {
    target: "Reserve target",
    targetMeta: "{multiple} months of fixed cost",
    averageFixedCost: "Average fixed cost",
    averageFixedCostFull: "average of 6 months",
    averageFixedCostPartial: "average of: {months}",
    averageFixedCostEstimate: "estimate based on: {months}",
    currentReserve: "Current reserve",
    currentReserveMeta: "Shows up once an account is marked part of the reserve.",
    coverage: "Coverage",
    coverageMeta: "Comes from the reserve's own positions, once there are any.",
  },
  monthlyTable: {
    title: "Fixed cost by month",
    month: "Month",
    amount: "Fixed cost",
    gap: "nothing categorized yet",
  },
  notice: {
    message: "The reserve target moved from {from} to {to} at the {month} close.",
    action: "Got it",
  },
  noticeBanner: {
    action: "See reserve",
  },
  multipleUpdated: "Reserve multiple updated.",
  noticeDismissed: "Notice dismissed.",
  empty: {
    noAccounts: "Connect a bank to see the household's reserve target here.",
    connectAction: "Connect bank",
    noHistory: "Categorize at least one month of spending to see the reserve target here.",
    categorizeAction: "Go to transactions",
  },
  error: {
    message: "Couldn't load the reserve right now. Check your connection and try again.",
    retry: "Try again",
  },
  errors: {
    invalidInput: "Check the fields and try again.",
    failed: "Couldn't save right now. Try again.",
    noticeNotFound: "That notice is no longer available in this household.",
  },
};

const ptBR = {
  overline: "Reserva",
  headline: {
    target: "Sua meta é {amount}.",
    estimate: "Sua meta estimada é {amount}.",
    noAccounts: "Conecte um banco para ver a meta da reserva da casa.",
    noHistory: "Categorize pelo menos um mês de gastos para ver a meta da reserva.",
  },
  multipleSelect: {
    label: "Meses de reserva",
  },
  tiles: {
    target: "Meta da reserva",
    targetMeta: "{multiple} meses de custo fixo",
    averageFixedCost: "Custo fixo médio",
    averageFixedCostFull: "média de 6 meses",
    averageFixedCostPartial: "média de: {months}",
    averageFixedCostEstimate: "estimativa com base em: {months}",
    currentReserve: "Reserva atual",
    currentReserveMeta: "Aparece quando uma conta for marcada como parte da reserva.",
    coverage: "Cobertura",
    coverageMeta: "Vem das posições da reserva, quando houver alguma.",
  },
  monthlyTable: {
    title: "Custo fixo por mês",
    month: "Mês",
    amount: "Custo fixo",
    gap: "sem transações categorizadas",
  },
  notice: {
    message: "A meta da reserva mudou de {from} para {to} no fechamento de {month}.",
    action: "Entendi",
  },
  noticeBanner: {
    action: "Ver reserva",
  },
  multipleUpdated: "Meses de reserva atualizados.",
  noticeDismissed: "Aviso dispensado.",
  empty: {
    noAccounts: "Conecte um banco para ver a meta da reserva da casa aqui.",
    connectAction: "Conectar banco",
    noHistory: "Categorize pelo menos um mês de gastos para ver a meta da reserva aqui.",
    categorizeAction: "Ir para transações",
  },
  error: {
    message: "Não deu para carregar a reserva agora. Confira sua conexão e tente de novo.",
    retry: "Tentar de novo",
  },
  errors: {
    invalidInput: "Confira os campos e tente de novo.",
    failed: "Não deu para salvar agora. Tente de novo.",
    noticeNotFound: "Esse aviso não está mais disponível nesta casa.",
  },
} satisfies typeof en;

const reserveStrings = { en, ptBR };

export const t = reserveStrings.ptBR;
