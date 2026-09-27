import { KINDS, PRODUCT_CATEGORY_IDS, isYearMonth, normalizeDescription } from "@feudo/core";
import { z } from "zod";

import { UNCATEGORIZED_FILTER } from "./href";
import { decodeSubcategoryRef } from "./subcategory-ref";

export const TRANSACTIONS_PAGE_SIZE = 50;

const yearMonthSchema = z.string().refine(isYearMonth).optional().catch(undefined);
const accountIdSchema = z.string().trim().min(1).max(64).optional().catch(undefined);
const pageSchema = z.coerce.number().int().min(1).max(10_000).optional().catch(undefined);

// Anything unreadable in the URL falls back to the default view rather than
// an error page: a stale bookmark still lands on this month's transactions.
export const transactionsSearchParamsSchema = z.object({
  mes: yearMonthSchema,
  conta: accountIdSchema,
  pagina: pageSchema,
  categoria: z.literal(UNCATEGORIZED_FILTER).optional().catch(undefined),
});
export type TransactionsSearchParams = z.input<typeof transactionsSearchParamsSchema>;

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
