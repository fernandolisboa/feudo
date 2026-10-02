export type { Money } from "./money/money";
export {
  add,
  subtract,
  formatBRL,
  formatMoney,
  decimalToCentavos,
  HOUSEHOLD_CURRENCY,
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
  localDateOf,
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
export { categoryOf, kindOf } from "./ledger/categories/kinds";

export type { CurrencyAmount, UncategorizedSummary } from "./ledger/categories/uncategorized";
export { summarizeUncategorized } from "./ledger/categories/uncategorized";

export type { RecurringInput, FixedSuggestion } from "./ledger/categories/recurring";
export { suggestFixedSubcategories } from "./ledger/categories/recurring";

export type { CounterpartType } from "./ledger/transfers/pairing";
export { pairingReadRange } from "./ledger/transfers/pairing";

export type {
  InternalTransfer,
  LedgerAccountType,
  LedgerContext,
  LedgerTransaction,
} from "./ledger/transfers/resolve-ledger";
export { resolveLedger } from "./ledger/transfers/resolve-ledger";

export { summarizeLedger } from "./ledger/totals";

export type {
  AverageFixedCost,
  AverageFixedCostDetail,
  AverageFixedCostMonth,
  CategorySpending,
  DashboardLine,
  LedgerDashboard,
  MonthTotals,
  MonthlyPoint,
} from "./ledger/dashboard";
export { averageFixedCost, buildLedgerDashboard, dashboardMonthRange } from "./ledger/dashboard";

export { formatBasisPointsPercent, formatCompactReais } from "./money/format";

export {
  DEFAULT_RESERVE_MULTIPLE,
  MAX_RESERVE_MULTIPLE,
  MIN_RESERVE_MULTIPLE,
  RESERVE_TARGET_NOTICE_THRESHOLD_BASIS_POINTS,
} from "./reserve/constants";
export type { ReserveTarget } from "./reserve/target";
export { computeReserveTarget, InvalidReserveMultipleError } from "./reserve/target";
export type { ReserveTargetNoticeInput } from "./reserve/notice";
export { shouldNotifyReserveTargetChange } from "./reserve/notice";

export { FGC_LIMIT_PER_CONGLOMERATE, FGCOOP_LIMIT_PER_INSTITUTION } from "./institutions/fgc";

export type { BankProfileCriterion } from "./banking-intel/criteria";
export {
  BANK_PROFILE_CRITERIA,
  BANK_PROFILE_SCORE_MAX,
  BANK_PROFILE_SCORE_MIN,
} from "./banking-intel/criteria";
