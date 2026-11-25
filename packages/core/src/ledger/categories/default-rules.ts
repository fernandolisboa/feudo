import type { ProductSubcategoryId, TransactionDirection } from "./taxonomy";

export type ProductDefaultRule = {
  pattern: string;
  direction: TransactionDirection | null;
  subcategoryId: ProductSubcategoryId;
};

// Position is precedence: the first rule whose pattern matches wins, so every
// more specific pattern (a merchant's own card-bill prefix, an operation
// marker, a longer merchant name that contains a shorter one) is declared
// before the pattern it would otherwise be shadowed by.
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

  { pattern: "AMAZON PRIME", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "AMAZONPRIMEBR", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "MELIMAIS", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "APPLE COM BILL", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "OPENAI", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "ANTHROPIC", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "CLAUDE AI", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "GOOGLE ONE", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "DISNEY PLUS", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "HBO MAX", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "GLOBOPLAY", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "PARAMOUNTPLUS", direction: "debit", subcategoryId: "bills.subscriptions" },
  { pattern: "YOUTUBE PREMIUM", direction: "debit", subcategoryId: "bills.subscriptions" },

  { pattern: "DROGASIL", direction: "debit", subcategoryId: "health.pharmacy" },
  { pattern: "DROGARIA", direction: "debit", subcategoryId: "health.pharmacy" },
  { pattern: "DROGARIAS", direction: "debit", subcategoryId: "health.pharmacy" },
  { pattern: "DROGA RAIA", direction: "debit", subcategoryId: "health.pharmacy" },
  { pattern: "RAIADROGASILSA", direction: "debit", subcategoryId: "health.pharmacy" },
  { pattern: "PAGUE MENOS", direction: "debit", subcategoryId: "health.pharmacy" },
  { pattern: "FARMACIA", direction: "debit", subcategoryId: "health.pharmacy" },

  { pattern: "IFD", direction: "debit", subcategoryId: "food.delivery" },
  { pattern: "99FOOD", direction: "debit", subcategoryId: "food.delivery" },
  { pattern: "RAPPI", direction: "debit", subcategoryId: "food.delivery" },
  { pattern: "ZE DELIVERY", direction: "debit", subcategoryId: "food.delivery" },

  { pattern: "AMAZON", direction: "debit", subcategoryId: "shopping.online" },
  { pattern: "AMAZONMKTPLC", direction: "debit", subcategoryId: "shopping.online" },
  { pattern: "MERCADOLIVRE", direction: "debit", subcategoryId: "shopping.online" },
  { pattern: "MERCADO LIVRE", direction: "debit", subcategoryId: "shopping.online" },
  { pattern: "SHOPEE", direction: "debit", subcategoryId: "shopping.online" },
  { pattern: "SHEIN", direction: "debit", subcategoryId: "shopping.online" },
  { pattern: "ALIEXPRESS", direction: "debit", subcategoryId: "shopping.online" },

  { pattern: "SEPHORA", direction: "debit", subcategoryId: "health.personal-care" },
  { pattern: "EPOCA COSMETICOS", direction: "debit", subcategoryId: "health.personal-care" },
  { pattern: "OBOTICARIO", direction: "debit", subcategoryId: "health.personal-care" },
  { pattern: "O BOTICARIO", direction: "debit", subcategoryId: "health.personal-care" },

  { pattern: "PRIVALIA", direction: "debit", subcategoryId: "shopping.clothing" },
  { pattern: "LOJAS RENNER", direction: "debit", subcategoryId: "shopping.clothing" },
  { pattern: "RIACHUELO", direction: "debit", subcategoryId: "shopping.clothing" },

  { pattern: "AIRBNB", direction: "debit", subcategoryId: "leisure.travel" },
  { pattern: "SMILES", direction: "debit", subcategoryId: "leisure.travel" },
  { pattern: "POUSADA", direction: "debit", subcategoryId: "leisure.travel" },
  { pattern: "HOTEL", direction: "debit", subcategoryId: "leisure.travel" },
  { pattern: "LATAM", direction: "debit", subcategoryId: "leisure.travel" },
  { pattern: "BOOKING COM", direction: "debit", subcategoryId: "leisure.travel" },
  { pattern: "DECOLAR", direction: "debit", subcategoryId: "leisure.travel" },

  { pattern: "STEAM", direction: "debit", subcategoryId: "leisure.gaming" },
  { pattern: "STEAMGAMES COM", direction: "debit", subcategoryId: "leisure.gaming" },
  { pattern: "NINTENDO", direction: "debit", subcategoryId: "leisure.gaming" },
  { pattern: "NINTENDOESHOP", direction: "debit", subcategoryId: "leisure.gaming" },
  { pattern: "NINTENDOESHOPBR", direction: "debit", subcategoryId: "leisure.gaming" },
  { pattern: "NUUVEM", direction: "debit", subcategoryId: "leisure.gaming" },
  { pattern: "PLAYSTATION", direction: "debit", subcategoryId: "leisure.gaming" },
  { pattern: "XBOX", direction: "debit", subcategoryId: "leisure.gaming" },

  { pattern: "DETRAN", direction: "debit", subcategoryId: "transport.vehicle-taxes" },

  { pattern: "POSTO", direction: "debit", subcategoryId: "transport.fuel" },
  { pattern: "AUTO POSTO", direction: "debit", subcategoryId: "transport.fuel" },

  { pattern: "SEM PARAR", direction: "debit", subcategoryId: "transport.parking-tolls" },
  { pattern: "CONECTCAR", direction: "debit", subcategoryId: "transport.parking-tolls" },
  { pattern: "VELOE", direction: "debit", subcategoryId: "transport.parking-tolls" },
  { pattern: "ESTAPAR", direction: "debit", subcategoryId: "transport.parking-tolls" },

  { pattern: "NEOENERGIA", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "CAESB", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "ENEL", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "SABESP", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "CEMIG", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "COPEL", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "CPFL", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "COMGAS", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "ULTRAGAZ", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "SUPERGASBRAS", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "COPAGAZ", direction: "debit", subcategoryId: "housing.utilities" },
  { pattern: "LIQUIGAS", direction: "debit", subcategoryId: "housing.utilities" },

  { pattern: "AMIL", direction: "debit", subcategoryId: "health.insurance" },
  { pattern: "UNIMED", direction: "debit", subcategoryId: "health.insurance" },
  { pattern: "HAPVIDA", direction: "debit", subcategoryId: "health.insurance" },
  { pattern: "BRADESCO SAUDE", direction: "debit", subcategoryId: "health.insurance" },
  { pattern: "SULAMERICA SAUDE", direction: "debit", subcategoryId: "health.insurance" },

  { pattern: "SUPERMERCADO", direction: "debit", subcategoryId: "food.groceries" },
  { pattern: "SUPERMERCADOS", direction: "debit", subcategoryId: "food.groceries" },
  { pattern: "ATACADAO", direction: "debit", subcategoryId: "food.groceries" },
  { pattern: "ASSAI", direction: "debit", subcategoryId: "food.groceries" },
  { pattern: "CARREFOUR", direction: "debit", subcategoryId: "food.groceries" },
  { pattern: "PAO DE ACUCAR", direction: "debit", subcategoryId: "food.groceries" },
  { pattern: "HORTIFRUTI", direction: "debit", subcategoryId: "food.groceries" },
  { pattern: "SACOLAO", direction: "debit", subcategoryId: "food.groceries" },
];
