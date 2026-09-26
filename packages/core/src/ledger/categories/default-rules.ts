import type { ProductSubcategoryId, TransactionDirection } from "./taxonomy";

export type ProductDefaultRule = {
  pattern: string;
  direction: TransactionDirection | null;
  subcategoryId: ProductSubcategoryId;
};

export const PRODUCT_DEFAULT_RULES: readonly ProductDefaultRule[] = [
  { pattern: "PAGAMENTO FATURA", direction: "debit", subcategoryId: "transfers.card-bill" },
  { pattern: "PAGTO FATURA", direction: "debit", subcategoryId: "transfers.card-bill" },
  { pattern: "PGTO FATURA", direction: "debit", subcategoryId: "transfers.card-bill" },
  { pattern: "PAG FATURA", direction: "debit", subcategoryId: "transfers.card-bill" },
  { pattern: "CONDOMINIO", direction: "debit", subcategoryId: "housing.condo" },
  { pattern: "IPTU", direction: "debit", subcategoryId: "housing.property-tax" },
  { pattern: "IPVA", direction: "debit", subcategoryId: "transport.vehicle-taxes" },
  { pattern: "IOF", direction: "debit", subcategoryId: "financial.taxes" },
  { pattern: "TARIFA", direction: "debit", subcategoryId: "financial.bank-fees" },
  { pattern: "CESTA DE SERVICOS", direction: "debit", subcategoryId: "financial.bank-fees" },
  { pattern: "RENDIMENTO", direction: "credit", subcategoryId: "income.yields" },
  { pattern: "RENDIMENTOS", direction: "credit", subcategoryId: "income.yields" },
  { pattern: "UBER EATS", direction: "debit", subcategoryId: "food.delivery" },
  { pattern: "IFOOD", direction: "debit", subcategoryId: "food.delivery" },
  { pattern: "UBER", direction: "debit", subcategoryId: "transport.ride-hailing" },
  { pattern: "99APP", direction: "debit", subcategoryId: "transport.ride-hailing" },
  { pattern: "99 POP", direction: "debit", subcategoryId: "transport.ride-hailing" },
  { pattern: "NETFLIX", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "SPOTIFY", direction: "debit", subcategoryId: "bills.subscriptions" },
];
