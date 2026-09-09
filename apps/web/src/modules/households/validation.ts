import { z } from "zod";

export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";
export const DEFAULT_RESERVE_MULTIPLE = 6;
export const MIN_RESERVE_MULTIPLE = 3;
export const MAX_RESERVE_MULTIPLE = 12;

export const createHouseholdFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  timeZone: z.string().trim().min(1).default(DEFAULT_TIME_ZONE),
  reserveMultiple: z.coerce
    .number()
    .int()
    .min(MIN_RESERVE_MULTIPLE)
    .max(MAX_RESERVE_MULTIPLE)
    .default(DEFAULT_RESERVE_MULTIPLE),
});

export type CreateHouseholdFormInput = z.infer<typeof createHouseholdFormSchema>;

export const switchHouseholdFormSchema = z.object({
  householdId: z.string().trim().min(1),
});
