import { describe, expect, it } from "vitest";

import { formatBRL } from "../money/money";

import { FGC_FOUR_YEAR_CAP, FGC_LIMIT_PER_CONGLOMERATE, FGCOOP_LIMIT_PER_INSTITUTION } from "./fgc";

const NBSP = "\u00a0";

describe("deposit guarantee limits", () => {
  it("are R$ 250,000 per conglomerate or cooperative and R$ 1,000,000 per four years", () => {
    expect(formatBRL(FGC_LIMIT_PER_CONGLOMERATE)).toBe(`R$${NBSP}250.000,00`);
    expect(formatBRL(FGC_FOUR_YEAR_CAP)).toBe(`R$${NBSP}1.000.000,00`);
    expect(formatBRL(FGCOOP_LIMIT_PER_INSTITUTION)).toBe(`R$${NBSP}250.000,00`);
  });
});
