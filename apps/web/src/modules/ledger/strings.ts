const en = {
  overline: "Transactions",
  headline: {
    none: "No transactions in {month}",
    one: "1 transaction in {month}",
    many: "{count} transactions in {month}",
  },
  monthSwitcher: {
    previous: "Previous month",
    next: "Next month",
  },
  accountFilter: {
    label: "Account",
    all: "All accounts",
  },
  table: {
    date: "Date",
    description: "Description",
    account: "Account",
    amount: "Amount",
  },
  empty: {
    noAccounts: "Connect a bank to see the household's transactions here.",
    connectAction: "Connect bank",
    noTransactions: "Nothing recorded in {month}.",
  },
  pagination: {
    label: "Pages",
    page: "Page {page}",
    newer: "Newer",
    older: "Older",
  },
};

const ptBR = {
  overline: "Transações",
  headline: {
    none: "Nenhuma transação em {month}",
    one: "1 transação em {month}",
    many: "{count} transações em {month}",
  },
  monthSwitcher: {
    previous: "Mês anterior",
    next: "Próximo mês",
  },
  accountFilter: {
    label: "Conta",
    all: "Todas as contas",
  },
  table: {
    date: "Data",
    description: "Descrição",
    account: "Conta",
    amount: "Valor",
  },
  empty: {
    noAccounts: "Conecte um banco para ver as transações da casa aqui.",
    connectAction: "Conectar banco",
    noTransactions: "Nada registrado em {month}.",
  },
  pagination: {
    label: "Páginas",
    page: "Página {page}",
    newer: "Mais recentes",
    older: "Mais antigas",
  },
} satisfies typeof en;

const ledgerStrings = { en, ptBR };

export const t = ledgerStrings.ptBR;
