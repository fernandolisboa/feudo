import { z } from "zod";

export const ACCOUNT_LABELS = ["individual", "shared"] as const;

const providerItemIdSchema = z.string().trim().toLowerCase().pipe(z.uuid());
const idSchema = z.string().trim().min(1).max(64);

export const connectProviderFormSchema = z.object({
  consentId: idSchema,
  clientId: z.string().trim().min(1).max(200),
  clientSecret: z.string().trim().min(1).max(500),
  providerItemId: providerItemIdSchema,
});
export type ConnectProviderFormInput = z.infer<typeof connectProviderFormSchema>;

export const addConnectionFormSchema = z.object({
  providerItemId: providerItemIdSchema,
});
export type AddConnectionFormInput = z.infer<typeof addConnectionFormSchema>;

export const connectionIdFormSchema = z.object({
  connectionId: idSchema,
});

export const relabelAccountFormSchema = z.object({
  accountId: idSchema,
  label: z.enum(ACCOUNT_LABELS),
});
export type RelabelAccountFormInput = z.infer<typeof relabelAccountFormSchema>;
