import { describe, expect, it } from "vitest";

import { ProviderResponseShapeError } from "./provider";

import { createDocumentHasher } from "../document-hash";
import {
  FAKE_ACCOUNTS,
  FAKE_HOLDER_DOCUMENT,
  FAKE_INVESTMENTS,
  FAKE_ITEM_BANCO_FIXTURE,
  FAKE_ITEM_CORRETORA_FIXTURE,
  FAKE_ITEMS,
  FAKE_TRANSACTIONS,
} from "./fake-fixtures";
import {
  normalizeAccount,
  normalizeInvestment,
  normalizeItem,
  normalizeTransaction,
} from "./pluggy-normalize";
import type { PluggyInvestment } from "./pluggy-schemas";

const hasher = createDocumentHasher("unit-test-document-hash-key-with-32-chars!!");
const bancoAccounts = FAKE_ACCOUNTS[FAKE_ITEM_BANCO_FIXTURE] ?? [];
const bancoInvestments = FAKE_INVESTMENTS[FAKE_ITEM_BANCO_FIXTURE] ?? [];

function requireAt<T>(list: T[], index: number): T {
  const value = list[index];
  if (value === undefined) {
    throw new Error(`fixture index ${String(index)} is missing`);
  }
  return value;
}

describe("normalizeItem", () => {
  it("reads the institution from the connector", () => {
    const item = FAKE_ITEMS[FAKE_ITEM_BANCO_FIXTURE];
    if (!item) throw new Error("fixture missing");
    expect(normalizeItem(item)).toEqual({
      providerItemId: FAKE_ITEM_BANCO_FIXTURE,
      institutionName: "Banco Fixture",
      institutionProviderId: "601",
      lastUpdatedAt: new Date("2026-09-18T09:10:00.000Z"),
    });
  });

  it("keeps a never-synced item's lastUpdatedAt null", () => {
    expect(
      normalizeItem({
        id: "x",
        connector: { id: 1, name: "N" },
        status: "UPDATING",
        lastUpdatedAt: null,
      }).lastUpdatedAt,
    ).toBeNull();
  });
});

describe("normalizeAccount", () => {
  it("maps a checking account to integer centavos with a hashed holder document", () => {
    const normalized = normalizeAccount(requireAt(bancoAccounts, 0), hasher);
    expect(normalized).toEqual({
      providerAccountId: "a1000000-0000-4000-8000-000000000001",
      providerItemId: FAKE_ITEM_BANCO_FIXTURE,
      type: "checking",
      productType: null,
      name: "Conta corrente",
      balanceCentavos: 123456,
      currency: "BRL",
      holderDocumentHash: hasher(FAKE_HOLDER_DOCUMENT),
      ratePpm: null,
      rateType: null,
      dueDate: null,
      acquisitionDate: null,
    });
    expect(JSON.stringify(normalized)).not.toContain("123456789");
  });

  it("maps savings and credit cards by subtype", () => {
    expect(normalizeAccount(requireAt(bancoAccounts, 1), hasher)?.type).toBe("savings");
    expect(normalizeAccount(requireAt(bancoAccounts, 2), hasher)).toMatchObject({
      type: "credit_card",
      balanceCentavos: 35010,
    });
  });

  it("keeps a foreign-currency account's currency instead of converting", () => {
    expect(normalizeAccount(requireAt(bancoAccounts, 3), hasher)).toMatchObject({
      currency: "USD",
      balanceCentavos: 12000,
    });
  });

  it("leaves the holder hash null when the provider gives no document", () => {
    expect(
      normalizeAccount({ ...requireAt(bancoAccounts, 0), taxNumber: null }, hasher)
        ?.holderDocumentHash,
    ).toBeNull();
  });

  it("skips an account whose subtype Feudo does not model", () => {
    expect(
      normalizeAccount({ ...requireAt(bancoAccounts, 0), subtype: "PREPAID_CARD" }, hasher),
    ).toBeNull();
  });

  it("raises ProviderResponseShapeError when the normalized shape is invalid", () => {
    expect(() =>
      normalizeAccount({ ...requireAt(bancoAccounts, 0), currencyCode: "reais" }, hasher),
    ).toThrow(ProviderResponseShapeError);
  });
});

describe("normalizeInvestment", () => {
  it("maps a CDB quoted as a percentage of CDI, with its dates as ISO dates", () => {
    expect(normalizeInvestment(requireAt(bancoInvestments, 0), hasher)).toEqual({
      providerAccountId: "b1000000-0000-4000-8000-000000000001",
      providerItemId: FAKE_ITEM_BANCO_FIXTURE,
      type: "investment",
      productType: "CDB",
      name: "CDB Fixture 110% CDI",
      balanceCentavos: 1025075,
      currency: "BRL",
      holderDocumentHash: hasher(FAKE_HOLDER_DOCUMENT),
      ratePpm: 1_100_000,
      rateType: "percentage_of_cdi",
      dueDate: "2028-01-15",
      acquisitionDate: "2025-02-01",
    });
  });

  it("keeps an unknown acquisition date null rather than inventing one", () => {
    expect(normalizeInvestment(requireAt(bancoInvestments, 1), hasher).acquisitionDate).toBeNull();
  });

  it("classifies Tesouro Selic's SELIC index as other, resolved by product type later", () => {
    const treasury = requireAt(FAKE_INVESTMENTS[FAKE_ITEM_CORRETORA_FIXTURE] ?? [], 0);
    expect(normalizeInvestment(treasury, hasher)).toMatchObject({
      productType: "TREASURY",
      rateType: "other",
      ratePpm: 1_000_000,
    });
  });

  it("uses the fixed annual rate for a prefixed instrument", () => {
    const prefixed: PluggyInvestment = {
      ...requireAt(bancoInvestments, 0),
      rate: null,
      rateType: "PRE",
      fixedAnnualRate: 12.5,
    };
    expect(normalizeInvestment(prefixed, hasher)).toMatchObject({
      rateType: "fixed_annual",
      ratePpm: 125_000,
    });
  });

  it("infers fixed annual when only fixedAnnualRate is present", () => {
    const prefixed: PluggyInvestment = {
      ...requireAt(bancoInvestments, 0),
      rate: null,
      rateType: null,
      fixedAnnualRate: 10,
    };
    expect(normalizeInvestment(prefixed, hasher)).toMatchObject({
      rateType: "fixed_annual",
      ratePpm: 100_000,
    });
  });

  it("maps an IPCA-linked rate and a fund with no rate at all", () => {
    const ipca: PluggyInvestment = {
      ...requireAt(bancoInvestments, 0),
      rate: 6.2,
      rateType: "IPCA",
    };
    expect(normalizeInvestment(ipca, hasher)).toMatchObject({
      rateType: "inflation_linked",
      ratePpm: 62_000,
    });
    const fund: PluggyInvestment = {
      id: "f1",
      itemId: FAKE_ITEM_BANCO_FIXTURE,
      type: "MUTUAL_FUND",
      subtype: null,
      name: "Fundo Fixture",
      balance: 100,
      currencyCode: "brl",
      rate: null,
      rateType: null,
      fixedAnnualRate: null,
      dueDate: null,
      purchaseDate: null,
    };
    expect(normalizeInvestment(fund, hasher)).toMatchObject({
      productType: "MUTUAL_FUND",
      rateType: null,
      ratePpm: null,
      currency: "BRL",
    });
  });

  it("yields a null rate rather than throwing for a rate Number#toString renders in exponential notation", () => {
    const tinyRate: PluggyInvestment = {
      ...requireAt(bancoInvestments, 0),
      rate: 1e-7,
      rateType: "IPCA",
    };
    expect(normalizeInvestment(tinyRate, hasher)).toMatchObject({
      rateType: "inflation_linked",
      ratePpm: null,
    });
  });
});

describe("normalizeTransaction", () => {
  const transactions = FAKE_TRANSACTIONS["a1000000-0000-4000-8000-000000000001"] ?? [];

  it("hashes the payer of a credit as the counterpart", () => {
    expect(normalizeTransaction(requireAt(transactions, 0), hasher)).toEqual({
      providerTransactionId: "c1000000-0000-4000-8000-000000000001",
      providerAccountId: "a1000000-0000-4000-8000-000000000001",
      date: "2026-09-15",
      amountCentavos: 850000,
      currency: "BRL",
      description: "PIX RECEBIDO EMPRESA FIXTURE",
      providerCategory: "Salary",
      type: "credit",
      counterpartType: "cnpj",
      counterpartDocumentHash: hasher("12345678000195"),
    });
  });

  it("hashes the receiver of a debit as the counterpart", () => {
    expect(normalizeTransaction(requireAt(transactions, 1), hasher)).toMatchObject({
      type: "debit",
      amountCentavos: -98050,
      counterpartType: "cnpj",
      counterpartDocumentHash: hasher("98765432000110"),
    });
  });

  it("leaves the counterpart null when there is no payment data", () => {
    expect(normalizeTransaction(requireAt(transactions, 2), hasher)).toMatchObject({
      counterpartType: null,
      counterpartDocumentHash: null,
    });
  });
});
