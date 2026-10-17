import {
  KINDS,
  PRODUCT_CATEGORY_IDS,
  isYearMonth,
  normalizeDescription,
  type YearMonth,
} from "@feudo/core";
import { z } from "zod";

import { UNCATEGORIZED_FILTER } from "./href";
import { decodeSubcategoryRef } from "./subcategory-ref";

export const TRANSACTIONS_PAGE_SIZE = 50;

// isYearMonth's own pattern accepts any four-digit year: "0050-03" parses
// but Date.UTC folds years 0-99 into 1900-1999 downstream (formatYearMonth,
// shortMonthLabel), and "0000-01" makes shiftYearMonth's own arithmetic
// throw. Bounding the year here, in the one schema both / and /transacoes
// parse their `mes` param with, keeps every caller's month math (year * 12
// + ...) inside a range it was written for.
const MIN_YEAR_MONTH_YEAR = 1970;
const MAX_YEAR_MONTH_YEAR = 9999;

function isBoundedYearMonth(value: string): value is YearMonth {
  if (!isYearMonth(value)) return false;
  const year = Number(value.slice(0, 4));
  return year >= MIN_YEAR_MONTH_YEAR && year <= MAX_YEAR_MONTH_YEAR;
}

const yearMonthSchema = z.string().refine(isBoundedYearMonth).optional().catch(undefined);
const accountIdSchema = z.string().trim().min(1).max(64).optional().catch(undefined);
const pageSchema = z.coerce.number().int().min(1).max(10_000).optional().catch(undefined);

// z.iso.date() already rejects an impossible calendar day ("2026-02-30");
// the same bounded-year contract as yearMonthSchema on top of it, so a
// "de"/"ate" nobody can read falls back to undefined, which
// readFilteredTransactions treats as no range at all rather than an error
// page.
function isBoundedIsoDateYear(value: string): boolean {
  const year = Number(value.slice(0, 4));
  return year >= MIN_YEAR_MONTH_YEAR && year <= MAX_YEAR_MONTH_YEAR;
}

const isoDateSchema = z.iso.date().refine(isBoundedIsoDateYear).optional().catch(undefined);

export const SEARCH_QUERY_MAX_LENGTH = 80;

const searchQuerySchema = z
  .string()
  .trim()
  .transform((value) => value.slice(0, SEARCH_QUERY_MAX_LENGTH))
  .optional()
  .catch(undefined);

const categoryFilterSchema = z
  .union([z.literal(UNCATEGORIZED_FILTER), z.enum(PRODUCT_CATEGORY_IDS)])
  .optional()
  .catch(undefined);

const kindFilterSchema = z.enum(KINDS).optional().catch(undefined);

// Anything unreadable in the URL falls back to the default view rather than
// an error page: a stale bookmark still lands on this month's transactions.
// "de" and "ate" are read the same way: an unreadable value is dropped
// instead of breaking the page, and readFilteredTransactions decides what the
// resulting (de, ate) pair means (a range is active only once "de" survives).
export const transactionsSearchParamsSchema = z.object({
  mes: yearMonthSchema,
  conta: accountIdSchema,
  pagina: pageSchema,
  categoria: categoryFilterSchema,
  tipo: kindFilterSchema,
  busca: searchQuerySchema,
  de: isoDateSchema,
  ate: isoDateSchema,
});
export type TransactionsSearchParams = z.input<typeof transactionsSearchParamsSchema>;

// Same fallback contract as transactionsSearchParamsSchema: an unreadable
// month in the URL falls back to the default (the current month) rather
// than an error page.
export const OVERVIEW_TABS = ["resumo", "leitura", "contas"] as const;
export type OverviewTab = (typeof OVERVIEW_TABS)[number];
export const DEFAULT_OVERVIEW_TAB: OverviewTab = "resumo";

export const overviewSearchParamsSchema = z.object({
  mes: yearMonthSchema,
  aba: z.enum(OVERVIEW_TABS).optional().catch(undefined),
});
export type OverviewSearchParams = z.input<typeof overviewSearchParamsSchema>;

export function overviewTabOf(searchParams: OverviewSearchParams): OverviewTab {
  return overviewSearchParamsSchema.parse(searchParams).aba ?? DEFAULT_OVERVIEW_TAB;
}

const idSchema = z.string().trim().min(1).max(64);

const subcategoryRefSchema = z.string().transform((value, context) => {
  const ref = decodeSubcategoryRef(value);
  if (!ref) {
    context.addIssue({ code: "custom", message: "Unknown subcategory" });
    return z.NEVER;
  }
  return ref;
});

export const RULE_PATTERN_MIN_LENGTH = 3;
export const RULE_PATTERN_MAX_LENGTH = 80;

// The pattern is stored normalized (upper case, no accents or punctuation) so
// matching is the same whole-word comparison the product default rules use;
// the length bounds apply after normalizing, so punctuation cannot pad a
// one-letter pattern that would match half the statement.
const rulePatternSchema = z
  .string()
  .max(RULE_PATTERN_MAX_LENGTH * 2)
  .transform(normalizeDescription)
  .pipe(z.string().min(RULE_PATTERN_MIN_LENGTH).max(RULE_PATTERN_MAX_LENGTH));

const ruleDirectionSchema = z
  .enum(["credit", "debit", "any"])
  .transform((direction) => (direction === "any" ? null : direction));

export const categorizeTransactionFormSchema = z.discriminatedUnion("createRule", [
  z.object({
    transactionId: idSchema,
    subcategory: subcategoryRefSchema,
    createRule: z.literal("off"),
  }),
  z.object({
    transactionId: idSchema,
    subcategory: subcategoryRefSchema,
    createRule: z.literal("on"),
    pattern: rulePatternSchema,
    direction: ruleDirectionSchema,
  }),
]);
export type CategorizeTransactionFormInput = z.infer<typeof categorizeTransactionFormSchema>;

export const transactionIdFormSchema = z.object({ transactionId: idSchema });

export const ruleIdFormSchema = z.object({ ruleId: idSchema });

export const SUBCATEGORY_NAME_MAX_LENGTH = 40;

export const addSubcategoryFormSchema = z.object({
  categoryId: z.enum(PRODUCT_CATEGORY_IDS),
  name: z.string().trim().min(1).max(SUBCATEGORY_NAME_MAX_LENGTH),
  kind: z.enum(KINDS),
});
export type AddSubcategoryFormInput = z.infer<typeof addSubcategoryFormSchema>;

export const changeKindFormSchema = z.object({
  subcategory: subcategoryRefSchema,
  kind: z.enum(KINDS),
});
export type ChangeKindFormInput = z.infer<typeof changeKindFormSchema>;

export const transferMarkFormSchema = z.object({
  transactionId: idSchema,
  value: z.enum(["true", "false"]).transform((value) => value === "true"),
});
