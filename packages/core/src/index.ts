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

export type { CategorySuggestion, QueueCandidate, QueueItem } from "./ledger/categories/suggest";
export { buildCategorizationQueue } from "./ledger/categories/suggest";

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

export type { CriteriaWeights, CriterionWeightLevel, WeightLevels } from "./banking-intel/weights";
export {
  criterionShares,
  CRITERION_WEIGHT_MAX,
  CRITERION_WEIGHT_MIN,
  DEFAULT_WEIGHT_LEVELS,
  effectiveWeights,
  hasActiveLevel,
  isValidWeightLevel,
  requiredCriteriaOf,
  resolveCriteriaWeights,
} from "./banking-intel/weights";
export type {
  BankCandidate,
  BankComparison,
  BankScore,
  ComparisonSettings,
  CriterionComparison,
  StoredComparisonSettings,
} from "./banking-intel/scoring";
export {
  CANDIDATE_COUNT_MAX,
  CANDIDATE_COUNT_MIN,
  compareBanks,
  DEFAULT_CANDIDATE_COUNT,
  DEFAULT_COMPARISON_SETTINGS,
  DEFAULT_MINIMUM_SCORES,
  DEFAULT_PRO_CON_MIN_DIFFERENCE,
  isValidCandidateCount,
  isValidMinimumScore,
  isValidProConMinDifference,
  MINIMUM_SCORE_MAX,
  MINIMUM_SCORE_MIN,
  MINIMUM_SCORE_STEP,
  PRO_CON_MIN_DIFFERENCE_MAX,
  PRO_CON_MIN_DIFFERENCE_MIN,
  PRO_CON_MIN_DIFFERENCE_STEP,
  resolveComparisonSettings,
} from "./banking-intel/scoring";
export type { CriterionScoreOverride } from "./banking-intel/overrides";
export { applyScoreOverrides, referenceRevisedSinceOverride } from "./banking-intel/overrides";

export type {
  LiquidityMark,
  RateType,
  ReserveAccountType,
  ReserveProductId,
} from "./reserve/products";
export {
  LIQUIDITY_MARKS,
  RATE_TYPES,
  RESERVE_PRODUCTS,
  classifyReserveProduct,
} from "./reserve/products";
export type { PositionTax } from "./reserve/tax";
export { REGRESSIVE_INCOME_TAX_BRACKETS } from "./reserve/tax";
export type { ReserveMarketRates } from "./reserve/yield";
export type {
  ExclusionReason,
  PlacementEvaluation,
  PlacementYield,
  PositionGuarantee,
  PositionLiquidity,
  RankedPlacement,
  ReservePlacementRanking,
  ReservePositionAdvice,
  ReservePositionInput,
} from "./reserve/placement";
export {
  EXCLUSION_REASONS,
  rankReservePlacements,
  reservePositionAdvice,
} from "./reserve/placement";
export type { ReserveCoverage } from "./reserve/coverage";
export { computeReserveCoverage } from "./reserve/coverage";

export type {
  AnalysisFact,
  AnalysisInput,
  AnalysisKind,
  AnalysisOutput,
} from "./analysis/contract";
export {
  ANALYSIS_KINDS,
  analysisFactSchema,
  analysisInputSchema,
  analysisOutputSchema,
  currentAnalysisOutputSchema,
} from "./analysis/contract";
export { extractNumberTokens } from "./analysis/numbers";
export type { AnalysisViolation } from "./analysis/validate";
export { describeViolations, findAnalysisViolations } from "./analysis/validate";

export type { YearMonthRange } from "./privacy/deletion";
export {
  DELETION_GRACE_DAYS,
  deletionPurgeAt,
  deletionPurgeCutoff,
  groupConsecutiveMonths,
} from "./privacy/deletion";
export type { SuccessionCandidate } from "./households/succession";
export { pickSuccessor } from "./households/succession";
