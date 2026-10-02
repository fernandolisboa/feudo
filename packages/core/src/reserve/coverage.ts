import { HOUSEHOLD_CURRENCY } from "../money/money";

export type ReserveCoverage = {
  currentCentavos: number;
  percentBasisPoints: number | null;
  monthsTenths: number | null;
};

// How far the household's reserve positions go: in reais, as a share of the
// target and in months of average fixed cost. Only BRL balances count (no
// conversion is ever invented); shares and months are floored so the screen
// never claims more coverage than there is, and are null when the target or
// the average leaves nothing to divide by.
export function computeReserveCoverage(input: {
  reservePositions: readonly { balanceCentavos: number; currency: string }[];
  targetCentavos: number;
  averageFixedCostCentavos: number;
}): ReserveCoverage {
  const currentCentavos = input.reservePositions
    .filter((position) => position.currency === HOUSEHOLD_CURRENCY)
    .reduce((sum, position) => sum + position.balanceCentavos, 0);

  return {
    currentCentavos,
    percentBasisPoints:
      input.targetCentavos > 0
        ? Math.floor((currentCentavos * 10_000) / input.targetCentavos)
        : null,
    monthsTenths:
      input.averageFixedCostCentavos > 0
        ? Math.floor((currentCentavos * 10) / input.averageFixedCostCentavos)
        : null,
  };
}
