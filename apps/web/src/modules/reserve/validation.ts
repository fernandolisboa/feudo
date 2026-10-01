import { z } from "zod";
import { MAX_RESERVE_MULTIPLE, MIN_RESERVE_MULTIPLE } from "@feudo/core";

export const updateReserveMultipleFormSchema = z.object({
  reserveMultiple: z.coerce.number().int().min(MIN_RESERVE_MULTIPLE).max(MAX_RESERVE_MULTIPLE),
});
export type UpdateReserveMultipleFormInput = z.infer<typeof updateReserveMultipleFormSchema>;

export const dismissNoticeFormSchema = z.object({
  noticeId: z.string().trim().min(1),
});
