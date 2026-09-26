import {
  productSubcategory,
  type HouseholdSubcategory,
  type Kind,
  type ProductSubcategoryId,
  type SubcategoryRef,
} from "./taxonomy";

export type KindContext = {
  overrides: ReadonlyMap<ProductSubcategoryId, Kind>;
  householdSubcategories: ReadonlyMap<string, HouseholdSubcategory>;
};

export function kindOf(ref: SubcategoryRef, context: KindContext): Kind | null {
  switch (ref.type) {
    case "product":
      return context.overrides.get(ref.id) ?? productSubcategory(ref.id).kind;
    case "household": {
      const subcategory = context.householdSubcategories.get(ref.id);
      return subcategory ? subcategory.kind : null;
    }
  }
}
