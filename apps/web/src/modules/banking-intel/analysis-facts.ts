import type { AnalysisFact } from "@feudo/core";

import type { HouseholdScope } from "@/modules/households";

import { interpolate, interpolateAll } from "@/lib/interpolate";
import { buildBanksPageProps, type BanksPageProps } from "./page-props";
import { t } from "./strings";

function scoreValue(scoreLabel: string): string {
  return /^\d+$/.test(scoreLabel)
    ? interpolate(t.analysisFacts.score, "{score}", scoreLabel)
    : scoreLabel;
}

// Built from the same view the Bancos page renders, so every score and every
// pro or con the analyst can quote is one the household sees there.
export function banksAnalysisFacts(props: BanksPageProps): AnalysisFact[] {
  const strings = t.analysisFacts;
  const facts: AnalysisFact[] = [
    {
      key: "banks.weights",
      label: strings.weights,
      value: props.weights
        .map((weight) =>
          interpolateAll(strings.weight, {
            criterion: weight.label,
            weight: String(weight.weight),
          }),
        )
        .join("; "),
    },
  ];
  props.currentRows.forEach((row, index) => {
    facts.push({
      key: `banks.current.${String(index + 1)}`,
      label: interpolate(strings.current, "{bank}", row.name),
      value: scoreValue(row.scoreLabel),
    });
  });
  if (props.baselineNotice !== null) {
    facts.push({ key: "banks.baseline", label: strings.baseline, value: props.baselineNotice });
  }
  props.candidates.forEach((candidate, index) => {
    const key = `banks.candidate.${String(index + 1)}`;
    facts.push(
      {
        key,
        label: interpolateAll(strings.candidate, {
          rank: candidate.rankLabel,
          bank: candidate.name,
        }),
        value: scoreValue(candidate.scoreLabel),
      },
      {
        key: `${key}.pros`,
        label: interpolate(strings.pros, "{bank}", candidate.name),
        value: candidate.pros.length === 0 ? candidate.emptyPros : candidate.pros.join("; "),
      },
      {
        key: `${key}.cons`,
        label: interpolate(strings.cons, "{bank}", candidate.name),
        value: candidate.cons.length === 0 ? candidate.emptyCons : candidate.cons.join("; "),
      },
    );
    if (candidate.missingEvidence !== null) {
      facts.push({
        key: `${key}.missing_evidence`,
        label: interpolate(strings.missingEvidence, "{bank}", candidate.name),
        value: candidate.missingEvidence,
      });
    }
  });
  return facts;
}

export async function getBanksAnalysisFacts(
  scope: HouseholdScope,
  now: Date,
): Promise<AnalysisFact[]> {
  return banksAnalysisFacts(await buildBanksPageProps(scope, { now, canManage: false }));
}
