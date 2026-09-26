export const KINDS = ["income", "fixed", "variable", "transfer"] as const;
export type Kind = (typeof KINDS)[number];

export const PRODUCT_CATEGORY_IDS = [
  "income",
  "housing",
  "food",
  "transport",
  "health",
  "education",
  "bills",
  "shopping",
  "leisure",
  "financial",
  "other",
  "investments",
  "transfers",
] as const;
export type ProductCategoryId = (typeof PRODUCT_CATEGORY_IDS)[number];

export const PRODUCT_SUBCATEGORIES = [
  { id: "income.salary", categoryId: "income", kind: "income" },
  { id: "income.self-employed", categoryId: "income", kind: "income" },
  { id: "income.benefits", categoryId: "income", kind: "income" },
  { id: "income.yields", categoryId: "income", kind: "income" },
  { id: "income.rent-received", categoryId: "income", kind: "income" },
  { id: "income.other", categoryId: "income", kind: "income" },

  { id: "housing.rent", categoryId: "housing", kind: "fixed" },
  { id: "housing.condo", categoryId: "housing", kind: "fixed" },
  { id: "housing.mortgage", categoryId: "housing", kind: "fixed" },
  { id: "housing.utilities", categoryId: "housing", kind: "fixed" },
  { id: "housing.property-tax", categoryId: "housing", kind: "fixed" },
  { id: "housing.repairs", categoryId: "housing", kind: "variable" },

  { id: "food.groceries", categoryId: "food", kind: "variable" },
  { id: "food.restaurants", categoryId: "food", kind: "variable" },
  { id: "food.delivery", categoryId: "food", kind: "variable" },

  { id: "transport.fuel", categoryId: "transport", kind: "variable" },
  { id: "transport.public", categoryId: "transport", kind: "variable" },
  { id: "transport.ride-hailing", categoryId: "transport", kind: "variable" },
  { id: "transport.parking-tolls", categoryId: "transport", kind: "variable" },
  { id: "transport.vehicle-maintenance", categoryId: "transport", kind: "variable" },
  { id: "transport.vehicle-taxes", categoryId: "transport", kind: "fixed" },
  { id: "transport.vehicle-financing", categoryId: "transport", kind: "fixed" },

  { id: "health.insurance", categoryId: "health", kind: "fixed" },
  { id: "health.pharmacy", categoryId: "health", kind: "variable" },
  { id: "health.doctors", categoryId: "health", kind: "variable" },
  { id: "health.dentist", categoryId: "health", kind: "variable" },
  { id: "health.fitness", categoryId: "health", kind: "fixed" },
  { id: "health.personal-care", categoryId: "health", kind: "variable" },

  { id: "education.tuition", categoryId: "education", kind: "fixed" },
  { id: "education.courses", categoryId: "education", kind: "variable" },
  { id: "education.books", categoryId: "education", kind: "variable" },

  { id: "bills.telecom", categoryId: "bills", kind: "fixed" },
  { id: "bills.subscriptions", categoryId: "bills", kind: "fixed" },
  { id: "bills.insurance", categoryId: "bills", kind: "fixed" },

  { id: "shopping.clothing", categoryId: "shopping", kind: "variable" },
  { id: "shopping.electronics", categoryId: "shopping", kind: "variable" },
  { id: "shopping.home", categoryId: "shopping", kind: "variable" },
  { id: "shopping.pets", categoryId: "shopping", kind: "variable" },
  { id: "shopping.online", categoryId: "shopping", kind: "variable" },
  { id: "shopping.other", categoryId: "shopping", kind: "variable" },

  { id: "leisure.travel", categoryId: "leisure", kind: "variable" },
  { id: "leisure.outings", categoryId: "leisure", kind: "variable" },
  { id: "leisure.gaming", categoryId: "leisure", kind: "variable" },

  { id: "financial.bank-fees", categoryId: "financial", kind: "variable" },
  { id: "financial.interest", categoryId: "financial", kind: "variable" },
  { id: "financial.taxes", categoryId: "financial", kind: "variable" },
  { id: "financial.loans", categoryId: "financial", kind: "fixed" },

  { id: "other.donations", categoryId: "other", kind: "variable" },
  { id: "other.gifts", categoryId: "other", kind: "variable" },
  { id: "other.alimony", categoryId: "other", kind: "fixed" },

  { id: "investments.movements", categoryId: "investments", kind: "transfer" },

  { id: "transfers.own-accounts", categoryId: "transfers", kind: "transfer" },
  { id: "transfers.card-bill", categoryId: "transfers", kind: "transfer" },
] as const satisfies readonly { id: string; categoryId: ProductCategoryId; kind: Kind }[];

export type ProductSubcategory = (typeof PRODUCT_SUBCATEGORIES)[number];
export type ProductSubcategoryId = ProductSubcategory["id"];

const PRODUCT_SUBCATEGORY_BY_ID: ReadonlyMap<string, ProductSubcategory> = new Map(
  PRODUCT_SUBCATEGORIES.map((subcategory) => [subcategory.id, subcategory]),
);

export function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value);
}

export function isProductCategoryId(value: string): value is ProductCategoryId {
  return (PRODUCT_CATEGORY_IDS as readonly string[]).includes(value);
}

export function isProductSubcategoryId(value: string): value is ProductSubcategoryId {
  return PRODUCT_SUBCATEGORY_BY_ID.has(value);
}

export function productSubcategory(id: ProductSubcategoryId): ProductSubcategory {
  const subcategory = PRODUCT_SUBCATEGORY_BY_ID.get(id);
  if (!subcategory) {
    throw new Error(`Unknown product subcategory ${id}`);
  }
  return subcategory;
}

export type SubcategoryRef =
  { type: "product"; id: ProductSubcategoryId } | { type: "household"; id: string };

export type HouseholdSubcategory = {
  id: string;
  categoryId: ProductCategoryId;
  name: string;
  kind: Kind;
};

export type TransactionDirection = "credit" | "debit";
