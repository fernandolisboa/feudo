import { z } from "zod";

export const TRANSACTIONS_PAGE_SIZE = 50;

const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .optional()
  .catch(undefined);
const accountIdSchema = z.string().trim().min(1).max(64).optional().catch(undefined);
const pageSchema = z.coerce.number().int().min(1).max(10_000).optional().catch(undefined);

// Anything unreadable in the URL falls back to the default view rather than
// an error page: a stale bookmark still lands on this month's transactions.
export const transactionsSearchParamsSchema = z.object({
  mes: yearMonthSchema,
  conta: accountIdSchema,
  pagina: pageSchema,
});
export type TransactionsSearchParams = z.input<typeof transactionsSearchParamsSchema>;
