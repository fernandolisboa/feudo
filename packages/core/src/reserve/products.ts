export const RATE_TYPES = [
  "percentage_of_cdi",
  "fixed_annual",
  "inflation_linked",
  "other",
] as const;
export type RateType = (typeof RATE_TYPES)[number];

export type ReserveAccountType = "checking" | "savings" | "investment";

export const LIQUIDITY_MARKS = ["daily", "not_daily"] as const;
export type LiquidityMark = (typeof LIQUIDITY_MARKS)[number];

// How each assumption ADR-0009 names is settled for a product:
// - liquidity: "daily" when the product type alone makes it redeemable within
//   one business day, "household" when only the household's mark can tell;
// - guarantee: "deposit" for a balance held at the account's institution,
//   "issued" for an instrument issued by an FGC or FGCoop member, "sovereign"
//   for Tesouro Selic, "none" for products no guarantee fund covers and
//   "unknown" for a product type Feudo does not recognise;
// - yield: "none" for a balance that earns nothing, "poupanca" for the legal
//   savings rule, "contract" for the position's own rate, "selic" for Tesouro
//   Selic;
// - tax: the regressive table, exempt, nothing to tax, or unknown.
export type ReserveProduct = {
  liquidity: "daily" | "household";
  guarantee: "deposit" | "issued" | "sovereign" | "none" | "unknown";
  yield: "none" | "poupanca" | "contract" | "selic";
  tax: "regressive" | "exempt" | "none" | "unknown";
};

export const RESERVE_PRODUCTS = {
  checking_account: { liquidity: "daily", guarantee: "deposit", yield: "none", tax: "none" },
  savings_account: { liquidity: "daily", guarantee: "deposit", yield: "poupanca", tax: "exempt" },
  cdb: { liquidity: "household", guarantee: "issued", yield: "contract", tax: "regressive" },
  rdb: { liquidity: "household", guarantee: "issued", yield: "contract", tax: "regressive" },
  lc: { liquidity: "household", guarantee: "issued", yield: "contract", tax: "regressive" },
  lci: { liquidity: "household", guarantee: "issued", yield: "contract", tax: "exempt" },
  lca: { liquidity: "household", guarantee: "issued", yield: "contract", tax: "exempt" },
  lig: { liquidity: "household", guarantee: "issued", yield: "contract", tax: "exempt" },
  tesouro_selic: { liquidity: "daily", guarantee: "sovereign", yield: "selic", tax: "regressive" },
  other_treasury: {
    liquidity: "household",
    guarantee: "none",
    yield: "contract",
    tax: "regressive",
  },
  uncovered: { liquidity: "household", guarantee: "none", yield: "contract", tax: "unknown" },
  unknown: { liquidity: "household", guarantee: "unknown", yield: "contract", tax: "unknown" },
} as const satisfies Record<string, ReserveProduct>;

export type ReserveProductId = keyof typeof RESERVE_PRODUCTS;

// Provider product types (Pluggy's investment subtype, else its type) that
// name an FGC-guaranteed instrument (FGC regulation, art. 2: time deposits,
// LC, LCI, LCA and LIG among them).
const ISSUED_PRODUCT_TYPES: Readonly<Record<string, ReserveProductId>> = {
  CDB: "cdb",
  RDB: "rdb",
  LC: "lc",
  LCI: "lci",
  LCA: "lca",
  LIG: "lig",
};

// Provider product types no deposit guarantee covers: funds, equities,
// corporate debt and structured notes. A type in neither list is "unknown",
// never assumed uncovered.
const UNCOVERED_PRODUCT_TYPES = new Set([
  "BDR",
  "COE",
  "CORPORATE_DEBT",
  "CRA",
  "CRI",
  "DEBENTURES",
  "DERIVATIVES",
  "EQUITY",
  "ETF",
  "ETF_FUND",
  "EXCHANGE_FUND",
  "FIP_FUND",
  "FIXED_INCOME_FUND",
  "INVESTMENT_FUND",
  "MULTIMARKET_FUND",
  "MUTUAL_FUND",
  "OFFSHORE_FUND",
  "OPTION",
  "REAL_ESTATE_FUND",
  "RETIREMENT",
  "SECURITY",
  "STOCK",
  "STOCK_FUND",
]);

const TREASURY_PRODUCT_TYPE = "TREASURY";

// The provider types every Tesouro Direto bond as TREASURY and reports the
// Selic index only as a rate type Feudo stores as "other" (sync's
// pluggy-normalize.ts), so the bond's own name is what tells Tesouro Selic
// apart from Tesouro IPCA+ or Prefixado.
const SELIC_IN_NAME = /\bselic\b/i;

export function classifyReserveProduct(input: {
  accountType: ReserveAccountType;
  productType: string | null;
  name: string;
}): ReserveProductId {
  switch (input.accountType) {
    case "checking":
      return "checking_account";
    case "savings":
      return "savings_account";
    case "investment": {
      const productType = input.productType?.trim().toUpperCase() ?? "";
      if (productType === TREASURY_PRODUCT_TYPE) {
        return SELIC_IN_NAME.test(input.name) ? "tesouro_selic" : "other_treasury";
      }
      const issued = ISSUED_PRODUCT_TYPES[productType];
      if (issued) {
        return issued;
      }
      return UNCOVERED_PRODUCT_TYPES.has(productType) ? "uncovered" : "unknown";
    }
  }
}
