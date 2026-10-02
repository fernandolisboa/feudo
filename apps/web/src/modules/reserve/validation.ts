import { z } from "zod";
import { LIQUIDITY_MARKS, MAX_RESERVE_MULTIPLE, MIN_RESERVE_MULTIPLE } from "@feudo/core";
import { institutionById } from "@feudo/core/reference-data";

export const updateReserveMultipleFormSchema = z.object({
  reserveMultiple: z.coerce.number().int().min(MIN_RESERVE_MULTIPLE).max(MAX_RESERVE_MULTIPLE),
});
export type UpdateReserveMultipleFormInput = z.infer<typeof updateReserveMultipleFormSchema>;

export const dismissNoticeFormSchema = z.object({
  noticeId: z.string().trim().min(1),
});

export const UNLISTED_INSTITUTION = "unlisted";
const AUTOMATIC_INSTITUTION = "auto";
const UNKNOWN_LIQUIDITY = "unknown";

export const updateReserveMarkFormSchema = z.object({
  accountId: z.string().trim().min(1),
  isReserve: z.enum(["true", "false"]).transform((value) => value === "true"),
  liquidity: z
    .enum([...LIQUIDITY_MARKS, UNKNOWN_LIQUIDITY])
    .transform((value) => (value === UNKNOWN_LIQUIDITY ? null : value)),
  institutionId: z
    .string()
    .refine(
      (value) =>
        value === AUTOMATIC_INSTITUTION ||
        value === UNLISTED_INSTITUTION ||
        institutionById(value) !== undefined,
    )
    .transform((value) => (value === AUTOMATIC_INSTITUTION ? null : value)),
});
export type UpdateReserveMarkFormInput = z.infer<typeof updateReserveMarkFormSchema>;
