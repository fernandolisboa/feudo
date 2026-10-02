import { describe, expect, it } from "vitest";

import { referenceFacts } from "./reference-facts";

describe("referenceFacts", () => {
  it("states the regressive income-tax table and the guarantee limits", () => {
    expect(referenceFacts()).toEqual([
      {
        key: "reference.income_tax.1",
        label: "IR sobre renda fixa com aplicação de até 180 dias",
        value: "22,5%",
      },
      {
        key: "reference.income_tax.2",
        label: "IR sobre renda fixa com aplicação de 181 a 360 dias",
        value: "20%",
      },
      {
        key: "reference.income_tax.3",
        label: "IR sobre renda fixa com aplicação de 361 a 720 dias",
        value: "17,5%",
      },
      {
        key: "reference.income_tax.4",
        label: "IR sobre renda fixa com aplicação de mais de 720 dias",
        value: "15%",
      },
      {
        key: "reference.income_tax.exempt",
        label: "Produtos isentos de IR",
        value: "LCI, LCA, LIG e poupança",
      },
      {
        key: "reference.fgc_limit",
        label: "Limite da garantia do FGC",
        value: "R$ 250.000,00 por CPF por conglomerado financeiro",
      },
      {
        key: "reference.fgcoop_limit",
        label: "Limite da garantia do FGCoop",
        value: "R$ 250.000,00 por CPF por cooperativa",
      },
    ]);
  });
});
