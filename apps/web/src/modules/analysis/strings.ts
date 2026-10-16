const en = {
  panel: {
    title: "Analyst's reading",
    empty:
      "No analyst reading yet. The first one arrives at the start of next month, or generate it now.",
    tradeOffs: "Trade-offs",
    counterArgument: "Counter-argument",
    inputsUsed: "Figures used",
    readFull: "See the full reading",
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
  analyses: {
    overline: "Analyses",
    overlineWith: "Analyses · {reading}",
    emptyTitle: "No analyst reading yet",
    readingSection: "The month and the reserve",
    readingOnlySection: "Reading",
    banksSection: "Banks",
    banksLink: "Open the bank comparison",
    inputsAside: "Every figure here appears on Feudo's own screens.",
    earlier: "This is an earlier reading. The household's figures may have changed since.",
    latest: "See the newest",
    history: "Readings",
    current: "shown",
    loadFailed: "Could not load the analyses right now. Check your connection and try again.",
    retry: "Try again",
  },
  banksNote: {
    title: "What the analyst says",
    meta: "read against the household's month and reserve",
    more: "See the full reading",
  },
  outcomes: {
    ok: "New reading ready.",
    noAccounts: "Connect a bank before asking for a reading.",
    exhausted: "The household used today's {limit} readings. Try again tomorrow.",
    inProgress: "A reading is already being generated for this household.",
    disabled: "The analyst is turned off at the moment.",
    failed:
      "The analyst could not write a reading this time. The attempt counts toward today's limit.",
    noTime: "There isn't enough time left right now to write a reading. Try again.",
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
  off: {
    title: "The analyst is off",
    explanation:
      "A household owner or admin registers an Anthropic key on the Casa page to turn the analyst on.",
    link: "Go to Casa",
  },
  aiSettings: {
    sectionTitle: "Analyst's key and models",
    description:
      "Readings are written through your own Anthropic account: the key below, which only an owner or admin can register, change or remove.",
    keyLabel: "Anthropic key",
    keyPlaceholder: "sk-ant-...",
    keyHelp: "Never shown again after it is saved; only the last 4 characters stay on screen.",
    currentKey: "Current key: •••• {last4}",
    noKey: "No key registered",
    removeAction: "Remove key",
    removeDialog: {
      title: "Remove the Anthropic key?",
      description:
        'Without a key the household has no analyst: the monthly reading is skipped and "Gerar nova leitura" is turned off until a new key is registered.',
      cancel: "Cancel",
      confirm: "Remove key",
    },
    monthlyFamilyLabel: "Monthly reading",
    onDemandFamilyLabel: 'On-demand reading ("Gerar nova leitura")',
    familyNames: { haiku: "Haiku", sonnet: "Sonnet", opus: "Opus" },
    save: "Save",
    viewerNote: "Only an owner or admin can change these.",
    providerUnavailable:
      "The analyst is off for this deployment. No key can be registered until it is back.",
    outcomes: {
      saved: "Settings saved.",
      removed: "Key removed.",
      invalidKey: "Anthropic refused this key. Check it and try again.",
      unavailable: "Could not verify the key with Anthropic right now. Try again.",
      notAllowed: "Only an owner or admin can change this.",
      invalidInput: "Check the fields and try again.",
      failed: "Could not save. Check your connection and try again.",
      rateLimited: "Too many key attempts recently. Wait a bit and try again.",
    },
  },
};

const ptBR = {
  panel: {
    title: "Leitura do analista",
    empty:
      "Ainda não há leitura do analista. A primeira chega no início do próximo mês, ou gere agora.",
    tradeOffs: "Prós e contras",
    counterArgument: "Contra-argumento",
    inputsUsed: "Números usados",
    readFull: "Ver a leitura completa",
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
  analyses: {
    overline: "Análises",
    overlineWith: "Análises · {reading}",
    emptyTitle: "Ainda não há leitura do analista",
    readingSection: "O mês e a reserva",
    readingOnlySection: "Leitura",
    banksSection: "Bancos",
    banksLink: "Abrir a comparação de bancos",
    inputsAside: "Todos estes números aparecem nas telas do Feudo.",
    earlier: "Esta é uma leitura anterior. Os números da casa podem ter mudado desde então.",
    latest: "Ver a mais recente",
    history: "Leituras",
    current: "em exibição",
    loadFailed: "Não deu para carregar as análises agora. Confira sua conexão e tente de novo.",
    retry: "Tentar de novo",
  },
  banksNote: {
    title: "O que o analista diz",
    meta: "lido junto com o mês e a reserva da casa",
    more: "Ver a leitura completa",
  },
  outcomes: {
    ok: "Nova leitura pronta.",
    noAccounts: "Conecte um banco antes de pedir uma leitura.",
    exhausted: "A casa usou as {limit} leituras de hoje. Tente de novo amanhã.",
    inProgress: "Já tem uma leitura sendo gerada para esta casa.",
    disabled: "O analista está desligado no momento.",
    failed:
      "O analista não conseguiu escrever uma leitura desta vez. A tentativa conta no limite de hoje.",
    noTime: "Não há tempo suficiente agora para escrever uma leitura. Tente de novo.",
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
  off: {
    title: "O analista está desativado",
    explanation:
      "Um responsável ou administrador registra uma chave da Anthropic em Casa para ativar o analista.",
    link: "Ir para Casa",
  },
  aiSettings: {
    sectionTitle: "Chave e modelos do analista",
    description:
      "As leituras são escritas com a sua própria conta da Anthropic: a chave abaixo, que só um responsável ou administrador pode registrar, alterar ou remover.",
    keyLabel: "Chave da Anthropic",
    keyPlaceholder: "sk-ant-...",
    keyHelp: "Não é mostrada de novo depois de salva; só os últimos 4 caracteres ficam na tela.",
    currentKey: "Chave atual: •••• {last4}",
    noKey: "Nenhuma chave registrada",
    removeAction: "Remover chave",
    removeDialog: {
      title: "Remover a chave da Anthropic?",
      description:
        'Sem uma chave a casa fica sem analista: a leitura mensal é pulada e "Gerar nova leitura" fica desligado até que uma chave nova seja registrada.',
      cancel: "Cancelar",
      confirm: "Remover chave",
    },
    monthlyFamilyLabel: "Leitura mensal",
    onDemandFamilyLabel: 'Leitura sob demanda ("Gerar nova leitura")',
    familyNames: { haiku: "Haiku", sonnet: "Sonnet", opus: "Opus" },
    save: "Salvar",
    viewerNote: "Só um responsável ou administrador pode alterar isto.",
    providerUnavailable:
      "O analista está desativado neste ambiente. Nenhuma chave pode ser registrada até ele voltar.",
    outcomes: {
      saved: "Configurações salvas.",
      removed: "Chave removida.",
      invalidKey: "A Anthropic recusou esta chave. Confira e tente de novo.",
      unavailable: "Não deu para verificar a chave com a Anthropic agora. Tente de novo.",
      notAllowed: "Só um responsável ou administrador pode alterar isto.",
      invalidInput: "Confira os campos e tente de novo.",
      failed: "Não deu para salvar. Confira sua conexão e tente de novo.",
      rateLimited: "Muitas tentativas de chave recentes. Espere um pouco e tente de novo.",
    },
  },
} satisfies typeof en;

const analysisStrings = { en, ptBR };

export const t = analysisStrings.ptBR;
