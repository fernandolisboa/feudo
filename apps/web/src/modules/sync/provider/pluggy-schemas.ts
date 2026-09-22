import { z } from "zod";

// Only the fields the normalizer reads; every object is `.loose()` so a new
// field on Pluggy's side never breaks a sync. Dates arrive as ISO strings.
const isoDateTime = z.string().min(1);

export const pluggyAuthResponseSchema = z.object({ apiKey: z.string().min(1) }).loose();

export const pluggyItemSchema = z
  .object({
    id: z.string().min(1),
    connector: z.object({ id: z.number().int(), name: z.string().min(1) }).loose(),
    status: z.string(),
    lastUpdatedAt: isoDateTime.nullable(),
  })
  .loose();
export type PluggyItem = z.infer<typeof pluggyItemSchema>;

export const pluggyAccountSchema = z
  .object({
    id: z.string().min(1),
    itemId: z.string().min(1),
    type: z.enum(["BANK", "CREDIT"]),
    subtype: z.string().min(1),
    name: z.string().min(1),
    marketingName: z.string().nullable().optional(),
    balance: z.number(),
    currencyCode: z.string().min(1),
    taxNumber: z.string().nullable().optional(),
  })
  .loose();
export type PluggyAccount = z.infer<typeof pluggyAccountSchema>;

export const pluggyInvestmentSchema = z
  .object({
    id: z.string().min(1),
    itemId: z.string().min(1),
    type: z.string().min(1),
    subtype: z.string().nullable().optional(),
    name: z.string().min(1),
    balance: z.number(),
    currencyCode: z.string().min(1),
    rate: z.number().nullable().optional(),
    rateType: z.string().nullable().optional(),
    fixedAnnualRate: z.number().nullable().optional(),
    dueDate: isoDateTime.nullable().optional(),
    purchaseDate: isoDateTime.nullable().optional(),
    issueDate: isoDateTime.nullable().optional(),
    status: z.string().nullable().optional(),
    owner: z.string().nullable().optional(),
    taxNumber: z.string().nullable().optional(),
  })
  .loose();
export type PluggyInvestment = z.infer<typeof pluggyInvestmentSchema>;

const documentSchema = z
  .object({ value: z.string().optional(), type: z.enum(["CPF", "CNPJ"]).optional() })
  .loose();

const participantSchema = z.object({ documentNumber: documentSchema.optional() }).loose();

export const pluggyTransactionSchema = z
  .object({
    id: z.string().min(1),
    accountId: z.string().min(1),
    date: isoDateTime,
    description: z.string(),
    type: z.enum(["DEBIT", "CREDIT"]),
    amount: z.number(),
    currencyCode: z.string().min(1),
    category: z.string().nullable().optional(),
    paymentData: z
      .object({ payer: participantSchema.optional(), receiver: participantSchema.optional() })
      .loose()
      .nullable()
      .optional(),
  })
  .loose();
export type PluggyTransaction = z.infer<typeof pluggyTransactionSchema>;

// The cursor-paginated shape Pluggy's /v2 listings answer with: `next` is a
// ready-made query string for the following page, and null, or absent, on the
// last one. An empty string is neither: it would read as the end of a listing
// the provider is in fact still offering, and a walk that stops early is a
// permanent gap in the ledger rather than a failure anyone would see.
export function pluggyCursorPageSchema<Item extends z.ZodType>(item: Item) {
  return z
    .object({
      results: z.array(item),
      next: z.string().min(1).nullable().optional(),
    })
    .loose();
}

export function pluggyPageSchema<Item extends z.ZodType>(item: Item) {
  return z
    .object({
      results: z.array(item),
      page: z.number().int(),
      totalPages: z.number().int(),
    })
    .loose();
}
