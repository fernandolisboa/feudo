import { z } from "zod";

import { citationSchema, isoDateSchema, reviewPredatesEvidence } from "../reference-data/review";

export const institutionIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

const cnpjBaseSchema = z.string().regex(/^\d{8}$/);

const coveredMemberSchema = z.object({
  legalName: z.string().trim().min(1),
  cnpjBase: cnpjBaseSchema,
});

const depositGuaranteeSchema = z.discriminatedUnion("fund", [
  z.object({
    fund: z.literal("FGC"),
    conglomerate: z.object({
      code: z.string().regex(/^C\d{7}$/),
      name: z.string().trim().min(1),
    }),
    coveredMembers: z.array(coveredMemberSchema).min(1),
  }),
  z.object({
    fund: z.literal("FGCoop"),
    scope: z.literal("per-associated-institution"),
  }),
]);

export const institutionSchema = z.object({
  id: institutionIdSchema,
  name: z.string().trim().min(1),
  reviewedAt: isoDateSchema,
  accountHolder: z.object({
    legalName: z.string().trim().min(1),
    cnpjBase: cnpjBaseSchema,
    ispb: z.string().regex(/^\d{8}$/),
    compe: z.string().regex(/^\d{3}$/),
    kind: z.enum(["bank", "payment-institution", "cooperative-system"]),
  }),
  openFinance: z.object({
    organisationId: z.uuid(),
    organisationName: z.string().trim().min(1),
    brands: z.array(z.string().trim().min(1)).min(1),
  }),
  depositGuarantee: depositGuaranteeSchema,
  notes: z.array(z.string().trim().min(1)),
  citations: z.array(citationSchema).min(1),
});

export const institutionsDatasetSchema = z
  .object({
    version: z.literal(1),
    institutions: z.array(institutionSchema).min(1),
  })
  .superRefine((dataset, ctx) => {
    const seen = new Set<string>();
    dataset.institutions.forEach((institution, index) => {
      if (reviewPredatesEvidence(institution.reviewedAt, institution.citations)) {
        ctx.addIssue({
          code: "custom",
          message: `institution "${institution.id}" reviewedAt is earlier than a citation's checkedAt`,
          path: ["institutions", index, "reviewedAt"],
        });
      }
      if (seen.has(institution.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate institution id "${institution.id}"`,
          path: ["institutions", index, "id"],
        });
      }
      seen.add(institution.id);
    });
  });

export type Institution = z.infer<typeof institutionSchema>;
export type DepositGuarantee = Institution["depositGuarantee"];
export type InstitutionsDatasetInput = z.input<typeof institutionsDatasetSchema>;

export function parseInstitutionsDataset(raw: unknown): readonly Institution[] {
  return institutionsDatasetSchema.parse(raw).institutions;
}
