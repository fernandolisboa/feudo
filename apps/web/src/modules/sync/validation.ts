import { z } from "zod";

export const ACCOUNT_LABELS = ["individual", "shared"] as const;

const providerItemIdSchema = z.string().trim().toLowerCase().pipe(z.uuid());
const idSchema = z.string().trim().min(1).max(64);

export const INSTITUTION_NAME_MAX_LENGTH = 80;

// The bank name the member typed, if any: blank is absent, so a caller that
// left it out falls back to whatever the provider reports (service.ts). The
// preprocess step runs before `.optional()`, which is what keeps the field
// optional in the inferred type instead of a required `string | undefined`.
const optionalInstitutionNameSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().trim().max(INSTITUTION_NAME_MAX_LENGTH).optional(),
);

export const connectProviderFormSchema = z.object({
  consentId: idSchema,
  clientId: z.string().trim().min(1).max(200),
  clientSecret: z.string().trim().min(1).max(500),
  providerItemId: providerItemIdSchema,
  institutionName: optionalInstitutionNameSchema,
});
export type ConnectProviderFormInput = z.infer<typeof connectProviderFormSchema>;

export const addConnectionFormSchema = z.object({
  providerItemId: providerItemIdSchema,
  institutionName: optionalInstitutionNameSchema,
});
export type AddConnectionFormInput = z.infer<typeof addConnectionFormSchema>;

export const connectionIdFormSchema = z.object({
  connectionId: idSchema,
});

export const renameConnectionFormSchema = z.object({
  connectionId: idSchema,
  institutionName: z.string().trim().min(1).max(INSTITUTION_NAME_MAX_LENGTH),
});
export type RenameConnectionFormInput = z.infer<typeof renameConnectionFormSchema>;

export const relabelAccountFormSchema = z.object({
  accountId: idSchema,
  label: z.enum(ACCOUNT_LABELS),
});
export type RelabelAccountFormInput = z.infer<typeof relabelAccountFormSchema>;

export const moveAccountFormSchema = z.object({
  accountId: idSchema,
  householdId: idSchema,
});
export type MoveAccountFormInput = z.infer<typeof moveAccountFormSchema>;
