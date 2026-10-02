import { describe, expect, it } from "vitest";

import { classifyReserveProduct, RESERVE_PRODUCTS } from "./products";

describe("classifyReserveProduct", () => {
  it("settles checking and savings accounts by account type", () => {
    expect(
      classifyReserveProduct({ accountType: "checking", productType: null, name: "Conta" }),
    ).toBe("checking_account");
    expect(
      classifyReserveProduct({ accountType: "savings", productType: null, name: "Poupança" }),
    ).toBe("savings_account");
  });

  it.each([
    ["CDB", "cdb"],
    ["cdb", "cdb"],
    [" RDB ", "rdb"],
    ["LC", "lc"],
    ["LCI", "lci"],
    ["LCA", "lca"],
    ["LIG", "lig"],
    ["MULTIMARKET_FUND", "uncovered"],
    ["STOCK", "uncovered"],
    ["DEBENTURES", "uncovered"],
    ["SOMETHING_NEW", "unknown"],
  ])("reads the provider product type %j as %s", (productType, expected) => {
    expect(
      classifyReserveProduct({ accountType: "investment", productType, name: "Posição" }),
    ).toBe(expected);
  });

  it("treats an investment with no product type as unknown", () => {
    expect(
      classifyReserveProduct({ accountType: "investment", productType: null, name: "X" }),
    ).toBe("unknown");
  });

  it("tells Tesouro Selic apart from the other Tesouro bonds by name", () => {
    expect(
      classifyReserveProduct({
        accountType: "investment",
        productType: "TREASURY",
        name: "Tesouro Selic 2029",
      }),
    ).toBe("tesouro_selic");
    expect(
      classifyReserveProduct({
        accountType: "investment",
        productType: "TREASURY",
        name: "Tesouro IPCA+ 2035",
      }),
    ).toBe("other_treasury");
  });

  it("only settles liquidity by product type where the type is enough (ADR-0009)", () => {
    const dailyByType = Object.entries(RESERVE_PRODUCTS)
      .filter(([, product]) => product.liquidity === "daily")
      .map(([id]) => id)
      .sort();
    expect(dailyByType).toEqual(["checking_account", "savings_account", "tesouro_selic"]);
  });

  it("exempts LCI, LCA, LIG and poupança from income tax", () => {
    const exempt = Object.entries(RESERVE_PRODUCTS)
      .filter(([, product]) => product.tax === "exempt")
      .map(([id]) => id)
      .sort();
    expect(exempt).toEqual(["lca", "lci", "lig", "savings_account"]);
  });
});
