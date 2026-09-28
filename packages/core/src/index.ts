export type { Money } from "./money/money";
export {
  add,
  subtract,
  formatBRL,
  formatMoney,
  decimalToCentavos,
  NonFiniteAmountError,
  NonIntegerAmountError,
} from "./money/money";

export type {
  RegistrationMode,
  RegistrationRefusalReason,
  RegistrationDecision,
} from "./auth/registration-policy";
export { evaluateRegistrationMode } from "./auth/registration-policy";

export type { RatePpm } from "./market-data/rates";
export {
  annualizeDailyPercentToRatePpm,
  InvalidDailyPercentError,
  InvalidRateError,
} from "./market-data/rates";
export { accumulate12MonthIpca, InvalidMonthlyRatesCountError } from "./market-data/ipca";
export { parsePercentToRatePpm, InvalidPercentStringError } from "./market-data/parse";

export type { IsoDateRange, YearMonth } from "./ledger/year-month";
export {
  InvalidIsoDateError,
  InvalidYearMonthError,
  formatYearMonth,
  isYearMonth,
  padDayRange,
  parseYearMonth,
  shiftIsoDate,
  shiftYearMonth,
  yearMonthDayRange,
  yearMonthOf,
} from "./ledger/year-month";

export type {
  HouseholdSubcategory,
  Kind,
  ProductCategoryId,
  ProductSubcategory,
  ProductSubcategoryId,
  SubcategoryRef,
  TransactionDirection,
} from "./ledger/categories/taxonomy";
export {
  KINDS,
  PRODUCT_CATEGORY_IDS,
  PRODUCT_SUBCATEGORIES,
  isKind,
  isProductCategoryId,
  isProductSubcategoryId,
  productSubcategory,
} from "./ledger/categories/taxonomy";

export {
  normalizeDescription,
  rulePatternFromDescription,
  matchesPattern,
} from "./ledger/categories/description";

export { mapProviderCategory, PLUGGY_CATEGORY_MAP } from "./ledger/categories/provider-mapping";

export type { ProductDefaultRule } from "./ledger/categories/default-rules";
export { PRODUCT_DEFAULT_RULES } from "./ledger/categories/default-rules";

export type {
  CategorizationRule,
  CategorizableTransaction,
  CategorizationSource,
  Categorization,
} from "./ledger/categories/categorize";
export { categorize, orderRules } from "./ledger/categories/categorize";

export type { KindContext } from "./ledger/categories/kinds";
export { kindOf } from "./ledger/categories/kinds";

export type { CurrencyAmount, UncategorizedSummary } from "./ledger/categories/uncategorized";
export { summarizeUncategorized } from "./ledger/categories/uncategorized";

export type { RecurringInput, FixedSuggestion } from "./ledger/categories/recurring";
export { suggestFixedSubcategories } from "./ledger/categories/recurring";

export { businessDaysBetween } from "./ledger/transfers/business-days";

export type {
  CounterpartType,
  PairableTransaction,
  TransferPair,
} from "./ledger/transfers/pairing";
export {
  MAX_TRANSFER_BUSINESS_DAYS,
  pairInternalTransfers,
  pairingReadRange,
} from "./ledger/transfers/pairing";

export type {
  InternalTransfer,
  LedgerAccountType,
  LedgerContext,
  LedgerTransaction,
  ResolvedTransaction,
} from "./ledger/transfers/resolve-ledger";
export { resolveLedger } from "./ledger/transfers/resolve-ledger";

export type { LedgerTotals } from "./ledger/totals";
export { summarizeLedger } from "./ledger/totals";
