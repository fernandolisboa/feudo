import { describe, expect, it } from "vitest";

import {
  ACCOUNT_TYPES,
  accountTypeRequirementsOf,
  DEFAULT_ACCOUNT_TYPE_FILTER,
  resolveAccountTypeFilter,
  unmetAccountTypeRequirements,
  type AccountType,
  type AccountTypeFilter,
  type AccountTypeStatus,
} from "./account-types";

function statuses(
  overrides: Partial<Record<AccountType, AccountTypeStatus>>,
): Record<AccountType, AccountTypeStatus> {
  return {
    joint: "not-found",
    shared: "not-found",
    jointInvestment: "not-found",
    mei: "not-found",
    ...overrides,
  };
}

describe("account types", () => {
  it("lists the four account types once each", () => {
    expect(new Set(ACCOUNT_TYPES).size).toBe(4);
    expect(ACCOUNT_TYPES).toEqual(["joint", "shared", "jointInvestment", "mei"]);
  });
});

describe("DEFAULT_ACCOUNT_TYPE_FILTER", () => {
  it("makes every account type optional and jointOnly false", () => {
    expect(DEFAULT_ACCOUNT_TYPE_FILTER).toEqual({
      jointBanking: "optional",
      jointOnly: false,
      jointInvestment: "optional",
      mei: "optional",
    });
  });
});

describe("resolveAccountTypeFilter", () => {
  it("falls back to every default when nothing is stored", () => {
    expect(resolveAccountTypeFilter({})).toEqual(DEFAULT_ACCOUNT_TYPE_FILTER);
  });

  it("keeps a valid stored field and falls back per field otherwise", () => {
    expect(
      resolveAccountTypeFilter({ jointBanking: "required", jointOnly: true, mei: "bogus" }),
    ).toEqual({
      jointBanking: "required",
      jointOnly: true,
      jointInvestment: "optional",
      mei: "optional",
    });
  });

  it("refuses a non-boolean jointOnly", () => {
    expect(resolveAccountTypeFilter({ jointOnly: "yes" })).toEqual(DEFAULT_ACCOUNT_TYPE_FILTER);
  });

  it("keeps a valid stored jointInvestment and mei", () => {
    expect(resolveAccountTypeFilter({ jointInvestment: "required", mei: "required" })).toEqual({
      ...DEFAULT_ACCOUNT_TYPE_FILTER,
      jointInvestment: "required",
      mei: "required",
    });
  });
});

describe("accountTypeRequirementsOf", () => {
  it("sets no requirement for the product default", () => {
    expect(accountTypeRequirementsOf(DEFAULT_ACCOUNT_TYPE_FILTER)).toEqual([]);
  });

  it("requires joint or shared when jointBanking is required and jointOnly is false", () => {
    const filter: AccountTypeFilter = { ...DEFAULT_ACCOUNT_TYPE_FILTER, jointBanking: "required" };

    expect(accountTypeRequirementsOf(filter)).toEqual(["jointOrShared"]);
  });

  it("requires joint only when jointBanking is required and jointOnly is true", () => {
    const filter: AccountTypeFilter = {
      ...DEFAULT_ACCOUNT_TYPE_FILTER,
      jointBanking: "required",
      jointOnly: true,
    };

    expect(accountTypeRequirementsOf(filter)).toEqual(["joint"]);
  });

  it("ignores jointOnly when jointBanking is optional", () => {
    const filter: AccountTypeFilter = { ...DEFAULT_ACCOUNT_TYPE_FILTER, jointOnly: true };

    expect(accountTypeRequirementsOf(filter)).toEqual([]);
  });

  it("adds jointInvestment and mei when required, alongside jointBanking", () => {
    const filter: AccountTypeFilter = {
      jointBanking: "required",
      jointOnly: true,
      jointInvestment: "required",
      mei: "required",
    };

    expect(accountTypeRequirementsOf(filter)).toEqual(["joint", "jointInvestment", "mei"]);
  });
});

describe("unmetAccountTypeRequirements", () => {
  it("names nothing when no requirement is set", () => {
    expect(unmetAccountTypeRequirements(statuses({}), [])).toEqual([]);
  });

  it("meets jointOrShared with either joint or shared offered", () => {
    expect(unmetAccountTypeRequirements(statuses({ joint: "offered" }), ["jointOrShared"])).toEqual(
      [],
    );
    expect(
      unmetAccountTypeRequirements(statuses({ shared: "offered" }), ["jointOrShared"]),
    ).toEqual([]);
    expect(unmetAccountTypeRequirements(statuses({}), ["jointOrShared"])).toEqual([
      "jointOrShared",
    ]);
  });

  it("requires true joint for the joint requirement, shared does not satisfy it", () => {
    expect(unmetAccountTypeRequirements(statuses({ shared: "offered" }), ["joint"])).toEqual([
      "joint",
    ]);
    expect(unmetAccountTypeRequirements(statuses({ joint: "offered" }), ["joint"])).toEqual([]);
  });

  it("names jointInvestment and mei only when not offered", () => {
    expect(
      unmetAccountTypeRequirements(statuses({ jointInvestment: "not-offered" }), [
        "jointInvestment",
      ]),
    ).toEqual(["jointInvestment"]);
    expect(
      unmetAccountTypeRequirements(statuses({ mei: "offered" }), ["jointInvestment", "mei"]),
    ).toEqual(["jointInvestment"]);
  });

  it("never treats not-found as meeting a requirement", () => {
    expect(unmetAccountTypeRequirements(statuses({}), ["joint", "jointInvestment", "mei"])).toEqual(
      ["joint", "jointInvestment", "mei"],
    );
  });
});
