import { z } from "zod";

export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";
export const DEFAULT_RESERVE_MULTIPLE = 6;
export const MIN_RESERVE_MULTIPLE = 3;
export const MAX_RESERVE_MULTIPLE = 12;

export const IANA_TIME_ZONES: readonly string[] = Intl.supportedValuesOf("timeZone");
const timeZoneSet = new Set(IANA_TIME_ZONES);

export const createHouseholdFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  timeZone: z
    .string()
    .trim()
    .min(1)
    .refine((value) => timeZoneSet.has(value), { message: "invalid time zone" })
    .default(DEFAULT_TIME_ZONE),
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

// Owner is excluded on purpose (ADR-0001): nobody is ever invited or
// role-updated into it, only households.transferOwnership moves it.
export const INVITABLE_ROLES = ["admin", "member"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const inviteMemberFormSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(255).pipe(z.email()),
  role: z.enum(INVITABLE_ROLES),
});
export type InviteMemberFormInput = z.infer<typeof inviteMemberFormSchema>;

export const invitationIdFormSchema = z.object({
  invitationId: z.string().trim().min(1),
});

export const memberIdFormSchema = z.object({
  memberId: z.string().trim().min(1),
});

export const updateMemberRoleFormSchema = z.object({
  memberId: z.string().trim().min(1),
  role: z.enum(INVITABLE_ROLES),
});
export type UpdateMemberRoleFormInput = z.infer<typeof updateMemberRoleFormSchema>;
