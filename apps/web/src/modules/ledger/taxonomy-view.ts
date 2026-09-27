import {
  PRODUCT_CATEGORY_IDS,
  PRODUCT_SUBCATEGORIES,
  kindOf,
  type HouseholdSubcategory,
  type Kind,
  type KindContext,
  type ProductCategoryId,
  type SubcategoryRef,
} from "@feudo/core";

import { encodeSubcategoryRef } from "./subcategory-ref";
import { t } from "./strings";

export type SubcategoryView = {
  value: string;
  ref: SubcategoryRef;
  label: string;
  kind: Kind;
  defaultKind: Kind | null;
};

export type CategoryView = {
  categoryId: ProductCategoryId;
  label: string;
  subcategories: SubcategoryView[];
};

export type SubcategoryLabel = { value: string; label: string; categoryLabel: string };

export type TaxonomyView = {
  categories: CategoryView[];
  labelOf: (ref: SubcategoryRef) => SubcategoryLabel | null;
  kindOf: (ref: SubcategoryRef) => Kind | null;
};

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

// The product's subcategories keep the order they ship in; a household's own
// come after them, alphabetically, so a new one never reshuffles the list a
// member has learned.
export function buildTaxonomyView(context: KindContext): TaxonomyView {
  const householdByCategory = new Map<ProductCategoryId, HouseholdSubcategory[]>();
  for (const subcategory of context.householdSubcategories.values()) {
    const list = householdByCategory.get(subcategory.categoryId) ?? [];
    list.push(subcategory);
    householdByCategory.set(subcategory.categoryId, list);
  }

  const categories = PRODUCT_CATEGORY_IDS.map((categoryId): CategoryView => {
    const product = PRODUCT_SUBCATEGORIES.filter(
      (subcategory) => subcategory.categoryId === categoryId,
    ).map((subcategory): SubcategoryView => {
      const ref: SubcategoryRef = { type: "product", id: subcategory.id };
      return {
        value: encodeSubcategoryRef(ref),
        ref,
        label: t.subcategories[subcategory.id],
        kind: context.overrides.get(subcategory.id) ?? subcategory.kind,
        defaultKind: subcategory.kind,
      };
    });
    const own = (householdByCategory.get(categoryId) ?? [])
      .toSorted((a, b) => collator.compare(a.name, b.name))
      .map((subcategory): SubcategoryView => {
        const ref: SubcategoryRef = { type: "household", id: subcategory.id };
        return {
          value: encodeSubcategoryRef(ref),
          ref,
          label: subcategory.name,
          kind: subcategory.kind,
          defaultKind: null,
        };
      });
    return { categoryId, label: t.categories[categoryId], subcategories: [...product, ...own] };
  });

  const labels = new Map<string, SubcategoryLabel>();
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      labels.set(subcategory.value, {
        value: subcategory.value,
        label: subcategory.label,
        categoryLabel: category.label,
      });
    }
  }

  return {
    categories,
    labelOf: (ref) => labels.get(encodeSubcategoryRef(ref)) ?? null,
    kindOf: (ref) => kindOf(ref, context),
  };
}
