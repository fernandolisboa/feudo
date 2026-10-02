import { z } from "zod";

import { institutionIdSchema } from "../institutions/institution";
import { INSTITUTIONS } from "../institutions/institutions";
import { citationSchema, isoDateSchema, reviewPredatesEvidence } from "../reference-data/review";

import {
  BANK_PROFILE_CRITERIA,
  BANK_PROFILE_SCORE_MAX,
  BANK_PROFILE_SCORE_MIN,
  type BankProfileCriterion,
} from "./criteria";

const criterionSchema = z
  .discriminatedUnion("status", [
    z.object({
      status: z.literal("scored"),
      score: z.int().min(BANK_PROFILE_SCORE_MIN).max(BANK_PROFILE_SCORE_MAX),
      evidence: z.string().trim().min(1),
      citations: z.array(citationSchema).min(1),
      reviewedAt: isoDateSchema,
    }),
    z.object({
      status: z.literal("insufficient-evidence"),
      reason: z.string().trim().min(1),
      citations: z.array(citationSchema).min(1).optional(),
      reviewedAt: isoDateSchema,
    }),
  ])
  .refine((entry) => !reviewPredatesEvidence(entry.reviewedAt, entry.citations), {
    message: "reviewedAt is earlier than a citation's checkedAt",
    path: ["reviewedAt"],
  });

const criteriaShape = Object.fromEntries(
  BANK_PROFILE_CRITERIA.map((criterion) => [criterion, criterionSchema]),
) as Record<BankProfileCriterion, typeof criterionSchema>;

export const bankProfileSchema = z.object({
  institutionId: institutionIdSchema,
  criteria: z.strictObject(criteriaShape),
});

export const bankProfilesDatasetSchema = z
  .object({
    version: z.literal(1),
    profiles: z.array(bankProfileSchema),
  })
  .superRefine((dataset, ctx) => {
    const known = new Set(INSTITUTIONS.map((institution) => institution.id));
    const seen = new Set<string>();
    dataset.profiles.forEach((profile, index) => {
      const path = ["profiles", index, "institutionId"];
      if (!known.has(profile.institutionId)) {
        ctx.addIssue({
          code: "custom",
          message: `unknown institution "${profile.institutionId}"`,
          path,
        });
      }
      if (seen.has(profile.institutionId)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate profile "${profile.institutionId}"`,
          path,
        });
      }
      seen.add(profile.institutionId);
    });
    for (const id of known) {
      if (!seen.has(id)) {
        ctx.addIssue({
          code: "custom",
          message: `institution "${id}" has no profile`,
          path: ["profiles"],
        });
      }
    }
  });

export type BankProfile = z.infer<typeof bankProfileSchema>;
export type BankProfileCriterionEntry = BankProfile["criteria"][BankProfileCriterion];
export type BankProfilesDatasetInput = z.input<typeof bankProfilesDatasetSchema>;

export function parseBankProfilesDataset(raw: unknown): readonly BankProfile[] {
  return bankProfilesDatasetSchema.parse(raw).profiles;
}
