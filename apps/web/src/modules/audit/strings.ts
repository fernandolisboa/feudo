const en = {
  kinds: {
    overview: "Overview",
    transactions: "Transactions",
    categories: "Categories",
    reserve: "Reserve",
    export: "Data export",
    analyses: "Analyses",
  },
  recentAccess: {
    sectionTitle: "Your recent access",
    empty: "No recent access yet.",
    table: {
      kind: "Type",
      when: "When",
    },
    pagination: {
      nav: "Access pages",
      status: "Page {page} of {pages} · latest {total} accesses",
      rowsPerPage: "Rows per page",
      previous: "Previous",
      next: "Next",
    },
  },
};

const ptBR = {
  kinds: {
    overview: "Visão geral",
    transactions: "Transações",
    categories: "Categorias",
    reserve: "Reserva",
    export: "Exportação de dados",
    analyses: "Análises",
  },
  recentAccess: {
    sectionTitle: "Seus acessos recentes",
    empty: "Nenhum acesso recente.",
    table: {
      kind: "Tipo",
      when: "Quando",
    },
    pagination: {
      nav: "Páginas de acessos",
      status: "Página {page} de {pages} · últimos {total} acessos",
      rowsPerPage: "Linhas por página",
      previous: "Anteriores",
      next: "Próximos",
    },
  },
} satisfies typeof en;

const auditStrings = { en, ptBR };

export const t = auditStrings.ptBR;
