const en = {
  panel: {
    title: "Analyst's reading",
    empty:
      "No analyst reading yet. The first one arrives at the start of next month, or generate it now.",
    tradeOffs: "Trade-offs",
    counterArgument: "Counter-argument",
    inputsUsed: "Figures used",
    kinds: {
      monthly: "Monthly reading of {month}",
      on_demand: "Reading requested for {month}",
    },
    generatedAt: "generated on {date}",
    promptVersion: "prompt {version}",
    disclaimer:
      "Written by AI from Feudo's own figures, which it does not change. It is not investment advice.",
    request: "Generate new reading",
    pending: "Generating reading…",
    remaining: "{remaining} of {limit} readings left today",
    remainingOne: "1 of {limit} readings left today",
    exhausted: "The household used today's {limit} readings. Try again tomorrow.",
    inProgress: "A reading is being generated. Reload the page in a minute.",
  },
  outcomes: {
    ok: "New reading ready.",
    noAccounts: "Connect a bank before asking for a reading.",
    exhausted: "The household used today's {limit} readings. Try again tomorrow.",
    inProgress: "A reading is already being generated for this household.",
    disabled: "The analyst is turned off at the moment.",
    failed:
      "The analyst could not write a reading this time. The attempt counts toward today's limit.",
  },
  errors: {
    failed: "Could not reach the server. Check your connection and try again.",
  },
  reference: {
    incomeTax: "Income tax on fixed income held {period}",
    periodUpTo: "up to {max} days",
    periodBetween: "{from} to {max} days",
    periodOver: "over {from} days",
    incomeTaxExempt: "Products exempt from income tax",
    incomeTaxExemptValue: "LCI, LCA, LIG and poupança",
    fgcLimit: "FGC guarantee limit",
    fgcLimitValue: "{amount} per CPF per financial conglomerate",
    fgcoopLimit: "FGCoop guarantee limit",
    fgcoopLimitValue: "{amount} per CPF per cooperative",
  },
};

const ptBR = {
  panel: {
    title: "Leitura do analista",
    empty:
      "Ainda não há leitura do analista. A primeira chega no início do próximo mês, ou gere agora.",
    tradeOffs: "Trade-offs",
    counterArgument: "Contra-argumento",
    inputsUsed: "Números usados",
    kinds: {
      monthly: "Leitura mensal de {month}",
      on_demand: "Leitura pedida sobre {month}",
    },
    generatedAt: "gerada em {date}",
    promptVersion: "prompt {version}",
    disclaimer:
      "Escrita por IA a partir dos números do Feudo, sem alterá-los. Não é recomendação de investimento.",
    request: "Gerar nova leitura",
    pending: "Gerando a leitura…",
    remaining: "Restam {remaining} de {limit} leituras hoje",
    remainingOne: "Resta 1 de {limit} leituras hoje",
    exhausted: "A casa usou as {limit} leituras de hoje. Tente de novo amanhã.",
    inProgress: "Uma leitura está sendo gerada. Recarregue a página em um minuto.",
  },
  outcomes: {
    ok: "Nova leitura pronta.",
    noAccounts: "Conecte um banco antes de pedir uma leitura.",
    exhausted: "A casa usou as {limit} leituras de hoje. Tente de novo amanhã.",
    inProgress: "Já tem uma leitura sendo gerada para esta casa.",
    disabled: "O analista está desligado no momento.",
    failed:
      "O analista não conseguiu escrever uma leitura desta vez. A tentativa conta no limite de hoje.",
  },
  errors: {
    failed: "Não deu para falar com o servidor. Confira sua conexão e tente de novo.",
  },
  reference: {
    incomeTax: "IR sobre renda fixa com aplicação de {period}",
    periodUpTo: "até {max} dias",
    periodBetween: "{from} a {max} dias",
    periodOver: "mais de {from} dias",
    incomeTaxExempt: "Produtos isentos de IR",
    incomeTaxExemptValue: "LCI, LCA, LIG e poupança",
    fgcLimit: "Limite da garantia do FGC",
    fgcLimitValue: "{amount} por CPF por conglomerado financeiro",
    fgcoopLimit: "Limite da garantia do FGCoop",
    fgcoopLimitValue: "{amount} por CPF por cooperativa",
  },
} satisfies typeof en;

const analysisStrings = { en, ptBR };

export const t = analysisStrings.ptBR;
