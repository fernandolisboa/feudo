import { PRODUCT_DEFAULT_RULES, type ProductDefaultRule } from "./default-rules";
import { matchesPattern, normalizeDescription } from "./description";
import { mapProviderCategory } from "./provider-mapping";
import type { SubcategoryRef, TransactionDirection } from "./taxonomy";

export type CategorizationRule = {
  id: string;
  pattern: string;
  direction: TransactionDirection | null;
  subcategory: SubcategoryRef;
  createdAt: Date;
};

export type CategorizableTransaction = {
  description: string;
  type: TransactionDirection;
  providerCategory: string | null;
  manual: SubcategoryRef | null;
};

export type CategorizationSource = "manual" | "rule" | "default" | "provider";

export type Categorization = {
  subcategory: SubcategoryRef;
  source: CategorizationSource;
  ruleId: string | null;
};

function tokenCount(pattern: string): number {
  return pattern.split(" ").filter((token) => token !== "").length;
}

function compareById(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function orderRules(rules: readonly CategorizationRule[]): CategorizationRule[] {
  return [...rules].sort((a, b) => {
    const tokensDelta = tokenCount(b.pattern) - tokenCount(a.pattern);
    if (tokensDelta !== 0) return tokensDelta;

    const lengthDelta = b.pattern.length - a.pattern.length;
    if (lengthDelta !== 0) return lengthDelta;

    const createdAtDelta = b.createdAt.getTime() - a.createdAt.getTime();
    if (createdAtDelta !== 0) return createdAtDelta;

    return compareById(a.id, b.id);
  });
}

const ORDERED_PRODUCT_DEFAULT_RULES: readonly ProductDefaultRule[] = [
  ...PRODUCT_DEFAULT_RULES,
].sort((a, b) => {
  const tokensDelta = tokenCount(b.pattern) - tokenCount(a.pattern);
  if (tokensDelta !== 0) return tokensDelta;
  return b.pattern.length - a.pattern.length;
});

function directionMatches(
  ruleDirection: TransactionDirection | null,
  transactionType: TransactionDirection,
): boolean {
  return ruleDirection === null || ruleDirection === transactionType;
}

export function categorize(
  transaction: CategorizableTransaction,
  orderedRules: readonly CategorizationRule[],
): Categorization | null {
  if (transaction.manual !== null) {
    return { subcategory: transaction.manual, source: "manual", ruleId: null };
  }

  const normalizedDescription = normalizeDescription(transaction.description);

  const householdRule = orderedRules.find(
    (rule) =>
      directionMatches(rule.direction, transaction.type) &&
      matchesPattern(normalizedDescription, rule.pattern),
  );
  if (householdRule) {
    return { subcategory: householdRule.subcategory, source: "rule", ruleId: householdRule.id };
  }

  const defaultRule = ORDERED_PRODUCT_DEFAULT_RULES.find(
    (rule) =>
      directionMatches(rule.direction, transaction.type) &&
      matchesPattern(normalizedDescription, rule.pattern),
  );
  if (defaultRule) {
    return {
      subcategory: { type: "product", id: defaultRule.subcategoryId },
      source: "default",
      ruleId: null,
    };
  }

  const providerSubcategoryId = mapProviderCategory(transaction.providerCategory);
  if (providerSubcategoryId !== null) {
    return {
      subcategory: { type: "product", id: providerSubcategoryId },
      source: "provider",
      ruleId: null,
    };
  }

  return null;
}
