import type { FinancialDataKind } from "./schema";
import { t } from "./strings";

// Exhaustive by construction: adding a FinancialDataKind without a case here
// fails the build (CLAUDE.md's exhaustive switch rule), so a new kind can
// never reach the household's own access list unlabeled.
export function financialDataKindLabel(kind: FinancialDataKind): string {
  switch (kind) {
    case "overview":
      return t.kinds.overview;
    case "transactions":
      return t.kinds.transactions;
    case "reserve":
      return t.kinds.reserve;
    case "export":
      return t.kinds.export;
  }
}
