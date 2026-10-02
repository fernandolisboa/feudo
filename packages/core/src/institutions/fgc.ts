import type { Money } from "../money/money";

// FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2 and §3:
// R$ 250,000 per CPF per financial conglomerate, and R$ 1,000,000 per CPF
// across all associated institutions in any four consecutive years.
export const FGC_LIMIT_PER_CONGLOMERATE: Money = { amountCentavos: 25_000_000, currency: "BRL" };
export const FGC_FOUR_YEAR_CAP: Money = { amountCentavos: 100_000_000, currency: "BRL" };

// CMN Resolution 4,933, Annex II, art. 3: FGCoop guarantees R$ 250,000 per
// beneficiary per associated institution (each cooperative counts alone).
export const FGCOOP_LIMIT_PER_INSTITUTION: Money = { amountCentavos: 25_000_000, currency: "BRL" };
