export const ACCOUNT_TYPES = ["joint", "shared", "jointInvestment", "mei"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

// ADR-0006 amendment 2026-10-16: whether a bank offers an account type is a
// yes/no fact, never a guessed quality score. not-found means no source
// either way, and never satisfies a household's filter.
export type AccountTypeStatus = "offered" | "not-offered" | "not-found";

export type RequirementLevel = "optional" | "required";

// Household data: a filter on top of the reference account types, stored in
// bank_criteria_weights.options alongside the weights. jointOnly only
// matters while jointBanking is required; it is ignored otherwise.
export type AccountTypeFilter = {
  jointBanking: RequirementLevel;
  jointOnly: boolean;
  jointInvestment: RequirementLevel;
  mei: RequirementLevel;
};

export const DEFAULT_ACCOUNT_TYPE_FILTER: AccountTypeFilter = {
  jointBanking: "optional",
  jointOnly: false,
  jointInvestment: "optional",
  mei: "optional",
};

// What a bank is shown to lack when it fails the household's filter.
// jointOrShared covers "a joint or a shared-access product, either one";
// joint is the stricter "only a true joint account counts" (jointOnly).
export type AccountTypeRequirement = "jointOrShared" | "joint" | "jointInvestment" | "mei";

function isValidRequirementLevel(value: unknown): value is RequirementLevel {
  return value === "optional" || value === "required";
}

export type StoredAccountTypeFilter = Partial<Record<keyof AccountTypeFilter, unknown>>;

// Stored data may predate a field added to the product later, or never have
// been set: each field falls back to its own product default independently,
// the same policy as resolveComparisonSettings.
export function resolveAccountTypeFilter(stored: StoredAccountTypeFilter): AccountTypeFilter {
  return {
    jointBanking: isValidRequirementLevel(stored.jointBanking)
      ? stored.jointBanking
      : DEFAULT_ACCOUNT_TYPE_FILTER.jointBanking,
    jointOnly:
      typeof stored.jointOnly === "boolean"
        ? stored.jointOnly
        : DEFAULT_ACCOUNT_TYPE_FILTER.jointOnly,
    jointInvestment: isValidRequirementLevel(stored.jointInvestment)
      ? stored.jointInvestment
      : DEFAULT_ACCOUNT_TYPE_FILTER.jointInvestment,
    mei: isValidRequirementLevel(stored.mei) ? stored.mei : DEFAULT_ACCOUNT_TYPE_FILTER.mei,
  };
}

// Which requirements the household's filter sets; jointOnly only matters
// while jointBanking is required, and is ignored otherwise.
export function accountTypeRequirementsOf(filter: AccountTypeFilter): AccountTypeRequirement[] {
  const requirements: AccountTypeRequirement[] = [];
  if (filter.jointBanking === "required") {
    requirements.push(filter.jointOnly ? "joint" : "jointOrShared");
  }
  if (filter.jointInvestment === "required") requirements.push("jointInvestment");
  if (filter.mei === "required") requirements.push("mei");
  return requirements;
}

function meetsRequirement(
  statuses: Readonly<Record<AccountType, AccountTypeStatus>>,
  requirement: AccountTypeRequirement,
): boolean {
  switch (requirement) {
    case "jointOrShared":
      return statuses.joint === "offered" || statuses.shared === "offered";
    case "joint":
      return statuses.joint === "offered";
    case "jointInvestment":
      return statuses.jointInvestment === "offered";
    case "mei":
      return statuses.mei === "offered";
  }
}

// Which of the given requirements a bank's account-type statuses fail to
// meet; only "offered" counts, never "not-found" (ADR-0006: never guess).
export function unmetAccountTypeRequirements(
  statuses: Readonly<Record<AccountType, AccountTypeStatus>>,
  requirements: readonly AccountTypeRequirement[],
): AccountTypeRequirement[] {
  return requirements.filter((requirement) => !meetsRequirement(statuses, requirement));
}
