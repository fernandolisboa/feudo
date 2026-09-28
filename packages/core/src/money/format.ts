import { roundHalfAwayFromZero } from "./money";

function formatTenths(tenths: number): string {
  const whole = Math.trunc(tenths / 10);
  const decimal = tenths % 10;
  return decimal === 0 ? String(whole) : `${String(whole)},${String(decimal)}`;
}

export function formatBasisPointsPercent(basisPoints: number): string {
  const tenths = roundHalfAwayFromZero(basisPoints / 10);
  const negative = tenths < 0;
  const magnitude = Math.abs(tenths);
  return `${negative ? "-" : ""}${formatTenths(magnitude)}%`;
}

const CENTAVOS_PER_REAL = 100;
const CENTAVOS_PER_TENTH_OF_THOUSAND = 10_000;
const CENTAVOS_PER_TENTH_OF_MILLION = 10_000_000;
const TENTHS_PER_THOUSAND = 1000 * 10;

// Every bucket boundary is decided on the already-rounded value, not the raw
// centavos: 999,999.99 reais must read "1 mi", not "1.000 mil", so a value
// that rounds up into the next unit has to be re-evaluated there instead of
// staying in the unit its unrounded amount belonged to.
export function formatCompactReais(centavos: number): string {
  const negative = centavos < 0;
  const sign = negative ? "-" : "";
  const absoluteCentavos = Math.abs(centavos);

  const wholeReais = roundHalfAwayFromZero(absoluteCentavos / CENTAVOS_PER_REAL);
  if (wholeReais < 1000) {
    return `${sign}${String(wholeReais)}`;
  }

  const thousandsTenths = roundHalfAwayFromZero(absoluteCentavos / CENTAVOS_PER_TENTH_OF_THOUSAND);
  if (thousandsTenths < TENTHS_PER_THOUSAND) {
    return `${sign}${formatTenths(thousandsTenths)} mil`;
  }

  const millionsTenths = roundHalfAwayFromZero(absoluteCentavos / CENTAVOS_PER_TENTH_OF_MILLION);
  return `${sign}${formatTenths(millionsTenths)} mi`;
}
