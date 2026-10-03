import { describe, expect, it } from "vitest";

import { financialDataKindLabel } from "./labels";
import { FINANCIAL_DATA_KINDS } from "./schema";

describe("financialDataKindLabel", () => {
  it.each(FINANCIAL_DATA_KINDS)("has a non-empty pt-BR label for %s", (kind) => {
    expect(financialDataKindLabel(kind).length).toBeGreaterThan(0);
  });

  it("maps every kind to its own pt-BR label", () => {
    expect(FINANCIAL_DATA_KINDS.map(financialDataKindLabel)).toEqual([
      "Visão geral",
      "Transações",
      "Categorias",
      "Reserva",
      "Exportação de dados",
    ]);
  });
});
