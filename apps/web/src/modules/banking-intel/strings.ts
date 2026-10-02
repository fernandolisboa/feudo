const en = {
  overline: "Banks",
  headline: {
    candidate: "{bank} is the bank that best fits the household's weights.",
    noCandidate: "No bank outside the ones you already use has a score with these weights.",
  },
  criteria: {
    cardBenefits: { label: "Card benefits", help: "points, cashback, annual fee and perks" },
    investmentAccess: {
      label: "Investment access",
      help: "Tesouro, CDBs, funds and a brokerage in the same app",
    },
    appQuality: { label: "App quality", help: "store ratings and stability" },
    security: { label: "Security", help: "account protection and incident history" },
    fees: { label: "Fees", help: "what keeping the account and moving money costs" },
    lockIn: {
      label: "Lock-in",
      help: "how much the bank holds you back; 100 is the easiest to leave",
    },
    publicReviews: { label: "Customer reviews", help: "Reclame Aqui and consumidor.gov.br" },
  },
  current: {
    title: "Banks you already use",
    bank: "Bank",
    score: "Score",
    reviewedAt: "Reviewed",
    noAccounts:
      "Connect a bank and the candidates will be compared with the banks you already use. Until then they are compared with the median bank on the list.",
    noneRecognized:
      "None of the household's connections matched a reviewed bank, so the candidates are compared with the median bank on the list.",
    unrecognized:
      "Not recognized: {labels}. Whoever connected it can rename the connection to the bank's name in Connect bank.",
    connectAction: "Connect bank",
  },
  candidates: {
    title: "Candidates",
    meta: "score from 0 to 100 with the household's weights",
    rank: "#{rank}",
    scoreOf: "out of 100",
    reviewedAt: "Reviewed on {date}",
    stale: "review older than 180 days",
    pros: "For",
    cons: "Against",
    noPros: "No criterion 10 or more points above what you already have.",
    noCons: "No criterion 10 or more points below what you already have.",
    noProsMedian: "No criterion 10 or more points above the median bank.",
    noConsMedian: "No criterion 10 or more points below the median bank.",
    comparison: "{criterion}: {candidate} vs. {baseline} ({bank})",
    median: "median",
    missingEvidence: "Insufficient evidence for: {criteria}.",
    noScore: "insufficient evidence",
  },
  weights: {
    title: "Criteria weights",
    defaults: "product defaults",
    custom: "set by the household",
    readOnly: "Only the household's owner or admin can change the weights.",
    reset: "Back to defaults",
    levels: ["Doesn't count", "Very low", "Low", "Medium", "High", "Very high"],
  },
  method:
    "The score is the average of each criterion's score, weighted by the household's weights. A criterion with insufficient evidence is left out of the average and shown as such. Scores come from sources Feudo cites and reviews, and they are not a recommendation.",
  analysisFacts: {
    weights: "Household criteria weights (0 to 5)",
    weight: "{criterion} {weight}",
    current: "Bank the household uses: {bank}",
    score: "score {score} out of 100",
    baseline: "Comparison baseline",
    candidate: "Candidate bank {rank}: {bank}",
    pros: "In favour of {bank}",
    cons: "Against {bank}",
    missingEvidence: "Evidence gaps for {bank}",
  },
  saved: "Weights saved.",
  resetDone: "Weights back to defaults.",
  error: {
    message: "Couldn't load the bank comparison right now. Check your connection and try again.",
    retry: "Try again",
  },
  errors: {
    invalidInput: "Check the weights and try again.",
    allZero: "At least one criterion has to count.",
    failed: "Couldn't save right now. Try again.",
    notAllowed: "Only the household's owner or admin can change the weights.",
  },
};

const ptBR = {
  overline: "Bancos",
  headline: {
    candidate: "{bank} é o banco que mais combina com os pesos da casa.",
    noCandidate: "Nenhum banco além dos que vocês já usam tem nota com esses pesos.",
  },
  criteria: {
    cardBenefits: {
      label: "Benefícios do cartão",
      help: "pontos, cashback, anuidade e vantagens",
    },
    investmentAccess: {
      label: "Acesso a investimentos",
      help: "Tesouro, CDB, fundos e corretora no mesmo app",
    },
    appQuality: { label: "Qualidade do app", help: "notas nas lojas e estabilidade" },
    security: { label: "Segurança", help: "proteção da conta e histórico de incidentes" },
    fees: { label: "Tarifas", help: "quanto custa manter a conta e movimentar dinheiro" },
    lockIn: {
      label: "Aprisionamento",
      help: "quanto o banco te prende; 100 é o mais fácil de sair",
    },
    publicReviews: {
      label: "Avaliações de clientes",
      help: "Reclame Aqui e consumidor.gov.br",
    },
  },
  current: {
    title: "Bancos que vocês já usam",
    bank: "Banco",
    score: "Nota",
    reviewedAt: "Revisão",
    noAccounts:
      "Conecte um banco para comparar os candidatos com os bancos que vocês já usam. Por enquanto, a comparação é com o banco mediano da lista.",
    noneRecognized:
      "Nenhuma conexão da casa corresponde a um banco avaliado, então a comparação é com o banco mediano da lista.",
    unrecognized:
      "Não reconhecemos: {labels}. Quem fez a conexão pode renomeá-la com o nome do banco em Conectar banco.",
    connectAction: "Conectar banco",
  },
  candidates: {
    title: "Candidatos",
    meta: "nota de 0 a 100 com os pesos da casa",
    rank: "{rank}º",
    scoreOf: "de 100",
    reviewedAt: "Revisado em {date}",
    stale: "revisão com mais de 180 dias",
    pros: "A favor",
    cons: "Contra",
    noPros: "Nenhum critério 10 pontos ou mais acima do que vocês já têm.",
    noCons: "Nenhum critério 10 pontos ou mais abaixo do que vocês já têm.",
    noProsMedian: "Nenhum critério 10 pontos ou mais acima do banco mediano.",
    noConsMedian: "Nenhum critério 10 pontos ou mais abaixo do banco mediano.",
    comparison: "{criterion}: {candidate} contra {baseline} ({bank})",
    median: "mediana",
    missingEvidence: "Evidência insuficiente em: {criteria}.",
    noScore: "evidência insuficiente",
  },
  weights: {
    title: "Pesos dos critérios",
    defaults: "padrão do Feudo",
    custom: "definidos pela casa",
    readOnly: "Só o responsável pela casa ou um administrador pode mudar os pesos.",
    reset: "Voltar ao padrão",
    levels: ["Não conta", "Muito baixo", "Baixo", "Médio", "Alto", "Muito alto"],
  },
  method:
    "A nota é a média das notas de cada critério, ponderada pelos pesos da casa. Critério com evidência insuficiente fica fora da média e aparece indicado. As notas vêm de fontes citadas e revisadas pelo Feudo e não são uma recomendação.",
  analysisFacts: {
    weights: "Pesos dos critérios da casa (0 a 5)",
    weight: "{criterion} {weight}",
    current: "Banco que a casa usa: {bank}",
    score: "nota {score} de 100",
    baseline: "Base da comparação",
    candidate: "Banco candidato {rank}: {bank}",
    pros: "A favor de {bank}",
    cons: "Contra {bank}",
    missingEvidence: "Evidência insuficiente sobre {bank}",
  },
  saved: "Pesos salvos.",
  resetDone: "Pesos de volta ao padrão.",
  error: {
    message:
      "Não deu para carregar a comparação de bancos agora. Confira sua conexão e tente de novo.",
    retry: "Tentar de novo",
  },
  errors: {
    invalidInput: "Confira os pesos e tente de novo.",
    allZero: "Pelo menos um critério precisa contar.",
    failed: "Não deu para salvar agora. Tente de novo.",
    notAllowed: "Só o responsável pela casa ou um administrador pode mudar os pesos.",
  },
} satisfies typeof en;

const bankingIntelStrings = { en, ptBR };

export const t = bankingIntelStrings.ptBR;
