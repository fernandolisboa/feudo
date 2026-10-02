import type { AnalysisInput, AnalysisOutput } from "@feudo/core";

export const FIXTURE_INPUT: AnalysisInput = {
  kind: "monthly",
  month: "2026-09",
  monthLabel: "setembro de 2026",
  facts: [
    { key: "ledger.month", label: "Mês analisado", value: "setembro de 2026" },
    { key: "ledger.income", label: "Renda em setembro de 2026", value: "R$ 12.400,00" },
    { key: "ledger.spending", label: "Gastos em setembro de 2026", value: "R$ 9.850,35" },
    { key: "ledger.savings_rate", label: "Taxa de poupança em setembro de 2026", value: "20,6%" },
    {
      key: "reserve.target",
      label: "Meta da reserva",
      value: "R$ 36.600,00 (6 meses de custo fixo)",
    },
    {
      key: "reserve.coverage",
      label: "Cobertura da reserva",
      value: "46,7% (2,8 meses de custo fixo)",
    },
    {
      key: "reserve.ranking.1",
      label: "Ranking da reserva, 1º lugar",
      value:
        "CDB em Banco Inter; rendimento real 6,1% a.a.; 12,4% a.a. depois do IR; IR 17,5%; FGC: ainda cabem R$ 230.000,00",
    },
    {
      key: "reference.fgc_limit",
      label: "Limite da garantia do FGC",
      value: "R$ 250.000,00 por CPF por conglomerado financeiro",
    },
  ],
};

export const FIXTURE_OUTPUT: AnalysisOutput = {
  reading:
    "Em setembro de 2026 a casa recebeu R$ 12.400,00 e gastou R$ 9.850,35, guardando 20,6% da renda.\n\nA reserva cobre 46,7% da meta de R$ 36.600,00, o equivalente a 2,8 meses de custo fixo.",
  tradeOffs: [
    "Colocar os próximos reais no CDB do 1º lugar rende 6,1% a.a. acima da inflação, mas depende de resgate em até 1 dia útil confirmado.",
  ],
  counterArgument:
    "Concentrar a reserva num só banco usa a garantia do FGC até R$ 250.000,00 por CPF; espalhar reduz o risco operacional.",
  citedKeys: [
    "ledger.income",
    "ledger.spending",
    "ledger.savings_rate",
    "reserve.target",
    "reserve.coverage",
    "reserve.ranking.1",
    "reference.fgc_limit",
  ],
};
