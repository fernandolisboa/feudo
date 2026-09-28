import {
  orderRules,
  parseYearMonth,
  shiftYearMonth,
  suggestFixedSubcategories,
  yearMonthDayRange,
  yearMonthOf,
  type KindContext,
  type LedgerContext,
  type RecurringInput,
  type YearMonth,
} from "@feudo/core";

import { getDb } from "@/platform/db/client";
import type { HouseholdSession } from "@/modules/households";
import { DEFAULT_TIME_ZONE, getHouseholdSettings, householdScope } from "@/modules/households";

import { resolveLedgerRows } from "./categorize-rows";
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

  const [settings, householdSubcategories, overrides, rules, holderDocumentHashes] =
    await Promise.all([
      getHouseholdSettings(scope, db),
      categorization.listHouseholdSubcategories(db),
      categorization.listKindOverrides(db),
      categorization.listRules(db),
      ledger.listHolderDocumentHashes(db),
    ]);
  const kinds: KindContext = {
    overrides,
    householdSubcategories: new Map(
      householdSubcategories.map((subcategory) => [subcategory.id, subcategory]),
    ),
  };
  const taxonomy = buildTaxonomyView(kinds);

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
  const context: LedgerContext = { rules, kinds, holderDocumentHashes };
  // row.kind, not taxonomy.kindOf(row.categorization.subcategory): an
  // internal transfer's kind is always "transfer" (design contract's #16),
  // whatever kind override the household set on the subcategory it landed
  // on, so only resolveLedger's own answer can be trusted to keep it out of
  // a fixed-cost suggestion.
  const recurringInputs = resolveLedgerRows(rows, context).flatMap((row): RecurringInput[] => {
    if (!row.categorization || row.kind === null) {
      return [];
    }
    return [
      {
        yearMonth: parseYearMonth(row.date.slice(0, 7)),
        description: row.description,
        type: row.type,
        amountCentavos: row.amountCentavos,
        subcategory: row.categorization.subcategory,
        kind: row.kind,
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
