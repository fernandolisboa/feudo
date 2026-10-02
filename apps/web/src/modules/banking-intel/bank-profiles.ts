import { isStale } from "@feudo/core";

import { BANK_PROFILES_DATASET } from "./bank-profiles-data";
import { parseBankProfilesDataset, type BankProfile } from "./bank-profile";

export const BANK_PROFILES: readonly BankProfile[] =
  parseBankProfilesDataset(BANK_PROFILES_DATASET);

export type StaleCriterion = {
  institutionId: string;
  criterion: string;
  reviewedAt: string;
};

export function staleCriteria(profiles: readonly BankProfile[], today: string): StaleCriterion[] {
  return profiles.flatMap((profile) =>
    Object.entries(profile.criteria)
      .filter(([, entry]) => isStale(entry.reviewedAt, today))
      .map(([criterion, entry]) => ({
        institutionId: profile.institutionId,
        criterion,
        reviewedAt: entry.reviewedAt,
      })),
  );
}
