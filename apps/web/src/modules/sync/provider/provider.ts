import { z } from "zod";

import type { Outcome } from "@/lib/outcome";

export const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "investment"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const RATE_TYPES = [
  "percentage_of_cdi",
  "fixed_annual",
  "inflation_linked",
  "other",
] as const;
export type RateType = (typeof RATE_TYPES)[number];

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const currencySchema = z.string().regex(/^[A-Z]{3}$/);

// The two shapes every provider payload is normalized into before anything
// else touches it (ADR-0005); investment positions are accounts of type
// "investment", not a third shape.
export const normalizedAccountSchema = z.object({
  providerAccountId: z.string().min(1),
  providerItemId: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES),
  productType: z.string().min(1).nullable(),
  name: z.string().min(1),
  balanceCentavos: z.number().int(),
  currency: currencySchema,
  holderDocumentHash: z.string().min(1).nullable(),
  ratePpm: z.number().int().nullable(),
  rateType: z.enum(RATE_TYPES).nullable(),
  dueDate: isoDateSchema.nullable(),
  acquisitionDate: isoDateSchema.nullable(),
});
export type NormalizedAccount = z.infer<typeof normalizedAccountSchema>;

export const normalizedTransactionSchema = z.object({
  providerTransactionId: z.string().min(1),
  providerAccountId: z.string().min(1),
  date: isoDateSchema,
  amountCentavos: z.number().int(),
  currency: currencySchema,
  description: z.string(),
  providerCategory: z.string().nullable(),
  type: z.enum(["credit", "debit"]),
  counterpartType: z.enum(["cpf", "cnpj"]).nullable(),
  counterpartDocumentHash: z.string().min(1).nullable(),
});
export type NormalizedTransaction = z.infer<typeof normalizedTransactionSchema>;

export type ProviderCredentials = { clientId: string; clientSecret: string };

export type ProviderConnection = {
  providerItemId: string;
  institutionName: string;
  institutionProviderId: string;
  lastUpdatedAt: Date | null;
};

export class ProviderUnavailableError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(`Data provider unavailable: ${message}`);
    this.name = "ProviderUnavailableError";
    this.status = status;
  }
}

export class ProviderResponseShapeError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string) {
    super(`Data provider response for ${endpoint} did not match the expected shape`);
    this.name = "ProviderResponseShapeError";
    this.endpoint = endpoint;
  }
}

export type DescribeConnectionOutcome = Outcome<{ connection: ProviderConnection }, "not_found">;

// One authenticated session against the provider, for the four operations
// ADR-0005 names plus the "which institution is this item" read the wizard
// needs before it creates a connection. Every method may throw
// ProviderUnavailableError or ProviderResponseShapeError.
export interface ProviderClient {
  describeConnection(providerItemId: string): Promise<DescribeConnectionOutcome>;
  listAccounts(providerItemId: string): Promise<NormalizedAccount[]>;
  listInvestmentPositions(providerItemId: string): Promise<NormalizedAccount[]>;
  listTransactionsSince(
    providerAccountId: string,
    sinceISODate: string,
  ): Promise<NormalizedTransaction[]>;
  refresh(providerItemId: string): Promise<void>;
}

export type AuthenticateOutcome = Outcome<{ client: ProviderClient }, "invalid_credentials">;

export interface DataProvider {
  readonly name: "pluggy" | "fake";
  authenticate(credentials: ProviderCredentials): Promise<AuthenticateOutcome>;
}
