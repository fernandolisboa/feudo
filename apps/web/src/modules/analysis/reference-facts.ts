import {
  FGC_LIMIT_PER_CONGLOMERATE,
  FGCOOP_LIMIT_PER_INSTITUTION,
  formatBasisPointsPercent,
  formatMoney,
  REGRESSIVE_INCOME_TAX_BRACKETS,
  type AnalysisFact,
} from "@feudo/core";

import { interpolate, interpolateAll } from "@/lib/interpolate";
import { t } from "./strings";

function periodLabel(index: number): string {
  const bracket = REGRESSIVE_INCOME_TAX_BRACKETS[index];
  const previous = REGRESSIVE_INCOME_TAX_BRACKETS[index - 1];
  if (!bracket) {
    return "";
  }
  if (!previous) {
    return interpolate(t.reference.periodUpTo, "{max}", String(bracket.maxHoldingDays));
  }
  if (!Number.isFinite(bracket.maxHoldingDays)) {
    return interpolate(t.reference.periodOver, "{from}", String(previous.maxHoldingDays));
  }
  return interpolateAll(t.reference.periodBetween, {
    from: String(previous.maxHoldingDays + 1),
    max: String(bracket.maxHoldingDays),
  });
}

// The reference constants every reserve figure rests on (ADR-0004): the
// regressive income-tax table and the guarantee limits, from packages/core.
export function referenceFacts(): AnalysisFact[] {
  return [
    ...REGRESSIVE_INCOME_TAX_BRACKETS.map((bracket, index) => ({
      key: `reference.income_tax.${String(index + 1)}`,
      label: interpolate(t.reference.incomeTax, "{period}", periodLabel(index)),
      value: formatBasisPointsPercent(bracket.basisPoints),
    })),
    {
      key: "reference.income_tax.exempt",
      label: t.reference.incomeTaxExempt,
      value: t.reference.incomeTaxExemptValue,
    },
    {
      key: "reference.fgc_limit",
      label: t.reference.fgcLimit,
      value: interpolate(
        t.reference.fgcLimitValue,
        "{amount}",
        formatMoney(FGC_LIMIT_PER_CONGLOMERATE),
      ),
    },
    {
      key: "reference.fgcoop_limit",
      label: t.reference.fgcoopLimit,
      value: interpolate(
        t.reference.fgcoopLimitValue,
        "{amount}",
        formatMoney(FGCOOP_LIMIT_PER_INSTITUTION),
      ),
    },
  ];
}
