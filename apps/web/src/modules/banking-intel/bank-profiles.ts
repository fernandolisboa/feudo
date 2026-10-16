import { ACCOUNT_TYPES, type AccountType, type AccountTypeStatus } from "@feudo/core";
import { isStale, parseBankProfilesDataset, type BankProfile } from "@feudo/core/reference-data";

import { BANK_PROFILES_DATASET } from "./bank-profiles-data";

export const BANK_PROFILES: readonly BankProfile[] =
  parseBankProfilesDataset(BANK_PROFILES_DATASET);

// compareBanks (packages/core) only ever reads an account type's status, not
// the rest of its review record (evidence, sources, summaryPtBr): this keeps
// that record for the bank's own page while handing scoring exactly the
// shape it scores on.
export function scorableProfiles(profiles: readonly BankProfile[] = BANK_PROFILES) {
  return profiles.map((profile) => ({
    institutionId: profile.institutionId,
    criteria: profile.criteria,
    accountTypes: Object.fromEntries(
      ACCOUNT_TYPES.map((type) => [type, profile.accountTypes[type].status]),
    ) as Record<AccountType, AccountTypeStatus>,
  }));
}

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

export function referenceProfileOf(institutionId: string): BankProfile | undefined {
  return BANK_PROFILES.find((profile) => profile.institutionId === institutionId);
}

export function hasBankProfile(institutionId: string): boolean {
  return referenceProfileOf(institutionId) !== undefined;
}
