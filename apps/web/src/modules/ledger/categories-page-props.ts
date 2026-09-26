import {
  orderRules,
  parseYearMonth,
  shiftYearMonth,
  suggestFixedSubcategories,
  yearMonthDayRange,
  yearMonthOf,
  type RecurringInput,
  type YearMonth,
} from "@feudo/core";

import { getDb } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";

import { categorizeRows } from "./categorize-rows";
import { createCategorizationRepository } from "./categorization-repository";
import { createHouseholdLedgerRepository } from "./repository";
import { encodeSubcategoryRef } from "./subcategory-ref";
import { t } from "./strings";
import { buildTaxonomyView, type CategoryView } from "./taxonomy-view";

export type RuleRow = {
  id: string;
  pattern: string;
  appliesTo: string;
  target: string;
};

export type FixedSuggestionRow = {
  subcategoryValue: string;
  subcategoryLabel: string;
  description: string;
};

export type CategoriesPageProps = {
  categories: CategoryView[];
  rules: RuleRow[];
  suggestions: FixedSuggestionRow[];
};

const RECURRING_MONTHS = 3;

// Recurring detection looks only at complete months, so a bill that has not
// come in yet this month cannot break a streak that is still running.
export async function getCategoriesPageProps(
  session: HouseholdSession,
  now: Date = new Date(),
): Promise<CategoriesPageProps> {
  const db = getDb();
  const scope = householdScope(session);
  const categorization = createCategorizationRepository(scope);
  const ledger = createHouseholdLedgerRepository(scope);

  const [settings, householdSubcategories, overrides, rules] = await Promise.all([
    getHouseholdSettings(scope, db),
    categorization.listHouseholdSubcategories(db),
    categorization.listKindOverrides(db),
    categorization.listRules(db),
  ]);
  const taxonomy = buildTaxonomyView({
    overrides,
    householdSubcategories: new Map(
      householdSubcategories.map((subcategory) => [subcategory.id, subcategory]),
    ),
  });

  const currentMonth = yearMonthOf(now, settings?.timeZone ?? DEFAULT_TIME_ZONE);
  const months: YearMonth[] = Array.from({ length: RECURRING_MONTHS }, (_, index) =>
    shiftYearMonth(currentMonth, index - RECURRING_MONTHS),
  );
  const rows = await ledger.listTransactionsInRange(db, {
    days: {
      from: yearMonthDayRange(months[0] ?? currentMonth).from,
      to: yearMonthDayRange(months[months.length - 1] ?? currentMonth).to,
    },
    accountId: null,
  });
  const recurringInputs = categorizeRows(rows, rules).flatMap((row): RecurringInput[] => {
    if (!row.categorization) {
      return [];
    }
    const kind = taxonomy.kindOf(row.categorization.subcategory);
    if (!kind) {
      return [];
    }
    return [
      {
        yearMonth: parseYearMonth(row.date.slice(0, 7)),
        description: row.description,
        type: row.type,
        amountCentavos: row.amountCentavos,
        subcategory: row.categorization.subcategory,
        kind,
      },
    ];
  });

  return {
    categories: taxonomy.categories,
    rules: orderRules(rules).flatMap((rule): RuleRow[] => {
      const target = taxonomy.labelOf(rule.subcategory);
      if (!target) {
        return [];
      }
      return [
        {
          id: rule.id,
          pattern: rule.pattern,
          appliesTo: t.categoriesPage.ruleTable[rule.direction ?? "any"],
          target: `${target.categoryLabel} · ${target.label}`,
        },
      ];
    }),
    suggestions: suggestFixedSubcategories(recurringInputs, months).flatMap(
      (suggestion): FixedSuggestionRow[] => {
        const label = taxonomy.labelOf(suggestion.subcategory);
        if (!label) {
          return [];
        }
        return [
          {
            subcategoryValue: encodeSubcategoryRef(suggestion.subcategory),
            subcategoryLabel: label.label,
            description: suggestion.description,
          },
        ];
      },
    ),
  };
}
