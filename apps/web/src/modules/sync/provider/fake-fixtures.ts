import type {
  PluggyAccount,
  PluggyInvestment,
  PluggyItem,
  PluggyTransaction,
} from "./pluggy-schemas";

// Pluggy-shaped fixtures (ADR-0005): what the real API returns for a
// personal Meu Pluggy connection, minus fields the normalizer never reads.
// Documents are the well-known test numbers, never a real person's.

export const FAKE_ITEM_BANCO_FIXTURE = "0f1e2d3c-4b5a-4a6b-8c7d-8e9f0a1b2c3d";
export const FAKE_ITEM_CORRETORA_FIXTURE = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
export const FAKE_INVALID_CLIENT_SECRET = "invalid";
export const FAKE_HOLDER_DOCUMENT = "123.456.789-09";

export const FAKE_ITEMS: Record<string, PluggyItem> = {
  [FAKE_ITEM_BANCO_FIXTURE]: {
    id: FAKE_ITEM_BANCO_FIXTURE,
    connector: { id: 601, name: "Banco Fixture" },
    status: "UPDATED",
    lastUpdatedAt: "2026-09-18T09:10:00.000Z",
  },
  [FAKE_ITEM_CORRETORA_FIXTURE]: {
    id: FAKE_ITEM_CORRETORA_FIXTURE,
    connector: { id: 602, name: "Corretora Fixture" },
    status: "UPDATED",
    lastUpdatedAt: "2026-09-18T09:12:00.000Z",
  },
};

export const FAKE_ACCOUNTS: Record<string, PluggyAccount[]> = {
  [FAKE_ITEM_BANCO_FIXTURE]: [
    {
      id: "a1000000-0000-4000-8000-000000000001",
      itemId: FAKE_ITEM_BANCO_FIXTURE,
      type: "BANK",
      subtype: "CHECKING_ACCOUNT",
      name: "Conta corrente",
      marketingName: "Conta Fixture",
      balance: 1234.56,
      currencyCode: "BRL",
      taxNumber: FAKE_HOLDER_DOCUMENT,
    },
    {
      id: "a1000000-0000-4000-8000-000000000002",
      itemId: FAKE_ITEM_BANCO_FIXTURE,
      type: "BANK",
      subtype: "SAVINGS_ACCOUNT",
      name: "Poupança",
      marketingName: null,
      balance: 5000,
      currencyCode: "BRL",
      taxNumber: FAKE_HOLDER_DOCUMENT,
    },
    {
      id: "a1000000-0000-4000-8000-000000000003",
      itemId: FAKE_ITEM_BANCO_FIXTURE,
      type: "CREDIT",
      subtype: "CREDIT_CARD",
      name: "Cartão Fixture Platinum",
      marketingName: "Fixture Platinum",
      balance: 350.1,
      currencyCode: "BRL",
      taxNumber: FAKE_HOLDER_DOCUMENT,
    },
    {
      id: "a1000000-0000-4000-8000-000000000004",
      itemId: FAKE_ITEM_BANCO_FIXTURE,
      type: "BANK",
      subtype: "CHECKING_ACCOUNT",
      name: "Conta global",
      marketingName: null,
      balance: 120,
      currencyCode: "USD",
      taxNumber: FAKE_HOLDER_DOCUMENT,
    },
  ],
  [FAKE_ITEM_CORRETORA_FIXTURE]: [],
};

export const FAKE_INVESTMENTS: Record<string, PluggyInvestment[]> = {
  [FAKE_ITEM_BANCO_FIXTURE]: [
    {
      id: "b1000000-0000-4000-8000-000000000001",
      itemId: FAKE_ITEM_BANCO_FIXTURE,
      type: "FIXED_INCOME",
      subtype: "CDB",
      name: "CDB Fixture 110% CDI",
      balance: 10250.75,
      currencyCode: "BRL",
      rate: 110,
      rateType: "CDI",
      fixedAnnualRate: null,
      dueDate: "2028-01-15T03:00:00.000Z",
      purchaseDate: "2025-02-01T03:00:00.000Z",
      issueDate: "2025-02-01T03:00:00.000Z",
      status: "ACTIVE",
      owner: "Titular Fixture",
      taxNumber: FAKE_HOLDER_DOCUMENT,
    },
    {
      id: "b1000000-0000-4000-8000-000000000002",
      itemId: FAKE_ITEM_BANCO_FIXTURE,
      type: "FIXED_INCOME",
      subtype: "LCI",
      name: "LCI Fixture 92% CDI",
      balance: 4000,
      currencyCode: "BRL",
      rate: 92,
      rateType: "CDI",
      fixedAnnualRate: null,
      dueDate: "2027-06-30T03:00:00.000Z",
      purchaseDate: null,
      issueDate: null,
      status: "ACTIVE",
      owner: "Titular Fixture",
      taxNumber: FAKE_HOLDER_DOCUMENT,
    },
  ],
  [FAKE_ITEM_CORRETORA_FIXTURE]: [
    {
      id: "b2000000-0000-4000-8000-000000000001",
      itemId: FAKE_ITEM_CORRETORA_FIXTURE,
      type: "FIXED_INCOME",
      subtype: "TREASURY",
      name: "Tesouro Selic 2029",
      balance: 15000.4,
      currencyCode: "BRL",
      rate: 100,
      rateType: "SELIC",
      fixedAnnualRate: null,
      dueDate: "2029-03-01T03:00:00.000Z",
      purchaseDate: "2024-08-12T03:00:00.000Z",
      issueDate: null,
      status: "ACTIVE",
      owner: "Titular Fixture",
      taxNumber: FAKE_HOLDER_DOCUMENT,
    },
  ],
};

export const FAKE_TRANSACTIONS: Record<string, PluggyTransaction[]> = {
  "a1000000-0000-4000-8000-000000000001": [
    {
      id: "c1000000-0000-4000-8000-000000000001",
      accountId: "a1000000-0000-4000-8000-000000000001",
      date: "2026-09-15T03:00:00.000Z",
      description: "PIX RECEBIDO EMPRESA FIXTURE",
      type: "CREDIT",
      amount: 8500,
      currencyCode: "BRL",
      category: "Salary",
      paymentData: {
        payer: { documentNumber: { value: "12.345.678/0001-95", type: "CNPJ" } },
      },
    },
    {
      id: "c1000000-0000-4000-8000-000000000002",
      accountId: "a1000000-0000-4000-8000-000000000001",
      date: "2026-09-16T03:00:00.000Z",
      description: "PIX ENVIADO CONDOMINIO",
      type: "DEBIT",
      amount: -980.5,
      currencyCode: "BRL",
      category: "Housing",
      paymentData: {
        receiver: { documentNumber: { value: "98.765.432/0001-10", type: "CNPJ" } },
      },
    },
    {
      id: "c1000000-0000-4000-8000-000000000003",
      accountId: "a1000000-0000-4000-8000-000000000001",
      date: "2026-09-17T03:00:00.000Z",
      description: "COMPRA CARTAO MERCADO",
      type: "DEBIT",
      amount: -212.3,
      currencyCode: "BRL",
      category: "Groceries",
      paymentData: null,
    },
  ],
};
