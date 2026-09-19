import type { z } from "zod";

import { decimalToCentavos, parsePercentToRatePpm } from "@feudo/core";

import type { DocumentHasher } from "../document-hash";
import type {
  AccountType,
  NormalizedAccount,
  NormalizedTransaction,
  ProviderConnection,
  RateType,
} from "./provider";
import {
  normalizedAccountSchema,
  normalizedTransactionSchema,
  ProviderResponseShapeError,
} from "./provider";
import type {
  PluggyAccount,
  PluggyInvestment,
  PluggyItem,
  PluggyTransaction,
} from "./pluggy-schemas";

function isoDateOnly(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? null;
}

function currencyOf(code: string): string {
  return code.toUpperCase();
}

function hashOrNull(hasher: DocumentHasher, document: string | null | undefined): string | null {
  return document ? hasher(document) : null;
}

export function normalizeItem(item: PluggyItem): ProviderConnection {
  return {
    providerItemId: item.id,
    institutionName: item.connector.name,
    institutionProviderId: String(item.connector.id),
    lastUpdatedAt: item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : null,
  };
}

const ACCOUNT_TYPE_BY_SUBTYPE: Record<string, AccountType> = {
  CHECKING_ACCOUNT: "checking",
  SAVINGS_ACCOUNT: "savings",
  CREDIT_CARD: "credit_card",
};

// A normalized shape that fails its own schema is a payload Feudo does not
// understand, the same failure as an unparseable page: it must surface as a
// typed provider error, never as a raw ZodError out of a Server Action.
function normalizeOrThrow<Shape>(
  schema: z.ZodType<Shape>,
  value: unknown,
  endpoint: string,
): Shape {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ProviderResponseShapeError(endpoint);
  }
  return parsed.data;
}

// An account whose subtype Feudo does not model yet is skipped, not fatal:
// one unknown product must not keep the rest of the bank out.
export function normalizeAccount(
  account: PluggyAccount,
  hasher: DocumentHasher,
): NormalizedAccount | null {
  const type = ACCOUNT_TYPE_BY_SUBTYPE[account.subtype];
  if (!type) {
    return null;
  }
  return normalizeOrThrow(
    normalizedAccountSchema,
    {
      providerAccountId: account.id,
      providerItemId: account.itemId,
      type,
      productType: null,
      name: account.name,
      balanceCentavos: decimalToCentavos(account.balance),
      currency: currencyOf(account.currencyCode),
      holderDocumentHash: hashOrNull(hasher, account.taxNumber),
      ratePpm: null,
      rateType: null,
      dueDate: null,
      acquisitionDate: null,
    },
    "accounts",
  );
}

// Pluggy names the index a fixed-income rate is quoted against ("CDI",
// "IPCA", "SELIC", "PRE"...). Only the two the reserve ranking resolves
// numerically get their own kind (ADR-0009); everything else is "other".
function rateTypeOf(investment: PluggyInvestment): RateType | null {
  const raw = investment.rateType?.trim().toUpperCase() ?? "";
  if (raw === "CDI") {
    return "percentage_of_cdi";
  }
  if (raw.startsWith("IPCA") || raw.startsWith("IGP")) {
    return "inflation_linked";
  }
  if (raw === "PRE" || raw === "PREFIXADO" || raw === "FIXED") {
    return "fixed_annual";
  }
  if (raw === "" && typeof investment.fixedAnnualRate === "number") {
    return "fixed_annual";
  }
  if (raw === "") {
    return null;
  }
  return "other";
}

function ratePpmOf(investment: PluggyInvestment, rateType: RateType | null): number | null {
  const percent =
    rateType === "fixed_annual" && typeof investment.fixedAnnualRate === "number"
      ? investment.fixedAnnualRate
      : investment.rate;
  if (typeof percent !== "number" || !Number.isFinite(percent)) {
    return null;
  }
  return parsePercentToRatePpm(percent.toString());
}

export function normalizeInvestment(
  investment: PluggyInvestment,
  hasher: DocumentHasher,
): NormalizedAccount {
  const rateType = rateTypeOf(investment);
  return normalizeOrThrow(
    normalizedAccountSchema,
    {
      providerAccountId: investment.id,
      providerItemId: investment.itemId,
      type: "investment",
      productType: investment.subtype || investment.type,
      name: investment.name,
      balanceCentavos: decimalToCentavos(investment.balance),
      currency: currencyOf(investment.currencyCode),
      holderDocumentHash: hashOrNull(hasher, investment.taxNumber),
      ratePpm: ratePpmOf(investment, rateType),
      rateType,
      dueDate: isoDateOnly(investment.dueDate),
      acquisitionDate: isoDateOnly(investment.purchaseDate),
    },
    "investments",
  );
}

function counterpartOf(
  transaction: PluggyTransaction,
): { type: "cpf" | "cnpj"; value: string } | null {
  // The counterpart is whoever is not this account: the receiver of a debit,
  // the payer of a credit.
  const participant =
    transaction.type === "DEBIT"
      ? transaction.paymentData?.receiver
      : transaction.paymentData?.payer;
  const document = participant?.documentNumber;
  if (!document?.value || !document.type) {
    return null;
  }
  return { type: document.type === "CPF" ? "cpf" : "cnpj", value: document.value };
}

export function normalizeTransaction(
  transaction: PluggyTransaction,
  hasher: DocumentHasher,
): NormalizedTransaction {
  const counterpart = counterpartOf(transaction);
  const counterpartDocumentHash = counterpart ? hasher(counterpart.value) : null;
  return normalizeOrThrow(
    normalizedTransactionSchema,
    {
      providerTransactionId: transaction.id,
      providerAccountId: transaction.accountId,
      date: isoDateOnly(transaction.date),
      amountCentavos: decimalToCentavos(transaction.amount),
      currency: currencyOf(transaction.currencyCode),
      description: transaction.description,
      providerCategory: transaction.category ?? null,
      type: transaction.type === "CREDIT" ? "credit" : "debit",
      counterpartType: counterpart && counterpartDocumentHash ? counterpart.type : null,
      counterpartDocumentHash,
    },
    "transactions",
  );
}
