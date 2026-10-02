import { z } from "zod";

export const REFERENCE_DATA_STALE_AFTER_DAYS = 180;

const MILLISECONDS_PER_DAY = 86_400_000;

export const isoDateSchema = z.iso.date();

export const citationSchema = z.object({
  url: z.url({ protocol: /^https$/ }),
  kind: z.enum(["primary", "secondary"]),
  checkedAt: isoDateSchema,
  finding: z.string().trim().min(1),
});

export type Citation = z.infer<typeof citationSchema>;

export function daysSinceReview(reviewedAt: string, today: string): number {
  const reviewed = Date.parse(`${reviewedAt}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  return Math.floor((now - reviewed) / MILLISECONDS_PER_DAY);
}

export function isStale(reviewedAt: string, today: string): boolean {
  return daysSinceReview(reviewedAt, today) > REFERENCE_DATA_STALE_AFTER_DAYS;
}
