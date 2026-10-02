import { z } from "zod";

import { isYearMonth } from "../ledger/year-month";

export const analysisFactSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/),
  label: z.string().trim().min(1).max(200),
  value: z.string().trim().min(1).max(300),
});

export type AnalysisFact = z.infer<typeof analysisFactSchema>;

export const ANALYSIS_KINDS = ["monthly", "on_demand"] as const;

export type AnalysisKind = (typeof ANALYSIS_KINDS)[number];

export const analysisInputSchema = z
  .object({
    kind: z.enum(ANALYSIS_KINDS),
    month: z.string().refine(isYearMonth, { message: "Expected a YYYY-MM month" }),
    monthLabel: z.string().trim().min(1).max(60),
    facts: z.array(analysisFactSchema).min(1).max(250),
  })
  .superRefine((input, ctx) => {
    const seen = new Set<string>();
    input.facts.forEach((fact, index) => {
      if (seen.has(fact.key)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate fact key "${fact.key}"`,
          path: ["facts", index, "key"],
        });
      }
      seen.add(fact.key);
    });
  });

export type AnalysisInput = z.infer<typeof analysisInputSchema>;

export const analysisOutputSchema = z.object({
  reading: z.string().trim().min(1).max(2400),
  tradeOffs: z.array(z.string().trim().min(1).max(700)).min(1).max(4),
  counterArgument: z.string().trim().min(1).max(900),
  citedKeys: z.array(z.string().trim().min(1)).min(1).max(40),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
