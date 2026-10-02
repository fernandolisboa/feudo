import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { INSTITUTIONS } from "./institutions";
import { matchInstitutionByLabel } from "./match";

describe("matchInstitutionByLabel", () => {
  it.each([
    ["Nubank", "nubank"],
    ["Banco Inter", "inter"],
    ["inter", "inter"],
    ["Itaú", "itau"],
    ["ITAU PERSONNALITE", "itau"],
    ["Bradesco", "bradesco"],
    ["next", "bradesco"],
    ["Banco do Brasil", "banco-do-brasil"],
    ["Caixa", "caixa"],
    ["Santander", "santander"],
    ["C6 Bank", "c6"],
    ["C6", "c6"],
    ["BTG", "btg"],
    ["BTG Pactual", "btg"],
    ["XP Investimentos", "xp"],
    ["Rico", "xp"],
    ["Sicoob Credicitrus", "sicoob"],
    ["PicPay", "picpay"],
    ["Mercado Pago", "mercado-pago"],
  ])("resolves %s to %s", (label, expected) => {
    expect(matchInstitutionByLabel(label)).toBe(expected);
  });

  it.each([
    "MeuPluggy",
    "",
    "   ",
    "Banco",
    "Investimentos",
    "Conta conjunta",
    "Nu",
    "Mercado Livre",
  ])("leaves %j unresolved", (label) => {
    expect(matchInstitutionByLabel(label)).toBeNull();
  });

  it("leaves a label two institutions share unresolved", () => {
    const [first, second] = INSTITUTIONS;
    if (!first || !second) throw new Error("fixture needs two institutions");
    const twins = [
      { ...first, name: "Banco Gêmeo" },
      { ...second, name: "Gêmeo Investimentos" },
    ];
    expect(matchInstitutionByLabel("Gêmeo", twins)).toBeNull();
  });

  it("resolves every institution's own name back to that institution", () => {
    for (const institution of INSTITUTIONS) {
      expect(matchInstitutionByLabel(institution.name)).toBe(institution.id);
    }
  });

  it("only ever returns null or a known institution id", () => {
    const ids = new Set(INSTITUTIONS.map((institution) => institution.id));
    fc.assert(
      fc.property(fc.string(), (label) => {
        const id = matchInstitutionByLabel(label);
        expect(id === null || ids.has(id)).toBe(true);
      }),
    );
  });
});
