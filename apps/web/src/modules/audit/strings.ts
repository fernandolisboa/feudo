const en = {
  kinds: {
    overview: "Overview",
    transactions: "Transactions",
    reserve: "Reserve",
    export: "Data export",
  },
  recentAccess: {
    sectionTitle: "Your recent access",
    empty: "No recent access yet.",
    table: {
      kind: "Type",
      when: "When",
    },
  },
};

const ptBR = {
  kinds: {
    overview: "Visão geral",
    transactions: "Transações",
    reserve: "Reserva",
    export: "Exportação de dados",
  },
  recentAccess: {
    sectionTitle: "Seus acessos recentes",
    empty: "Nenhum acesso recente.",
    table: {
      kind: "Tipo",
      when: "Quando",
    },
  },
} satisfies typeof en;

const auditStrings = { en, ptBR };

export const t = auditStrings.ptBR;
