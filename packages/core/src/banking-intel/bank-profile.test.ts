import { describe, expect, it } from "vitest";

import { INSTITUTIONS } from "../institutions/institutions";

import { ACCOUNT_TYPES } from "./account-types";
import { parseBankProfilesDataset } from "./bank-profile";
import { BANK_PROFILE_CRITERIA } from "./criteria";

const citation = {
  url: "https://www.bcb.gov.br/fis/tarifas/htms/00416968.asp",
  kind: "primary",
  checkedAt: "2026-10-02",
  finding: "Tariff registry entry.",
};

function scored(score: unknown) {
  return {
    status: "scored",
    score,
    evidence: "Evidence.",
    summaryPtBr: "Evidência.",
    citations: [citation],
    reviewedAt: "2026-10-02",
  };
}

function accountType(status: "offered" | "not-offered" | "not-found") {
  return {
    status,
    evidence: "Evidence.",
    summaryPtBr: "Evidência.",
    citations: status === "not-found" ? undefined : [citation],
    reviewedAt: "2026-10-02",
  };
}

function profile(institutionId: string) {
  return {
    institutionId,
    criteria: Object.fromEntries(
      BANK_PROFILE_CRITERIA.map((criterion) => [criterion, scored(60)]),
    ) as Record<string, Record<string, unknown>>,
    accountTypes: Object.fromEntries(
      ACCOUNT_TYPES.map((type) => [type, accountType("offered")]),
    ) as Record<string, Record<string, unknown>>,
  };
}

function dataset() {
  return { version: 1, profiles: INSTITUTIONS.map((institution) => profile(institution.id)) };
}

function first(raw: ReturnType<typeof dataset>) {
  const entry = raw.profiles[0];
  if (!entry) throw new Error("fixture has no profiles");
  return entry;
}

describe("parseBankProfilesDataset", () => {
  it("accepts one profile per institution with every criterion and account type", () => {
    expect(parseBankProfilesDataset(dataset())).toHaveLength(INSTITUTIONS.length);
  });

  it("accepts a criterion marked as insufficient evidence without citations", () => {
    const raw = dataset();
    first(raw).criteria.security = {
      status: "insufficient-evidence",
      reason: "No citable source.",
      summaryPtBr: "Sem fonte citável.",
      reviewedAt: "2026-10-02",
    };
    expect(parseBankProfilesDataset(raw)[0]?.criteria.security.status).toBe(
      "insufficient-evidence",
    );
  });

  it("fails when a scored criterion has no citation", () => {
    const raw = dataset();
    first(raw).criteria.fees = { ...scored(60), citations: [] };
    expect(() => parseBankProfilesDataset(raw)).toThrow();
  });

  it("fails when a criterion's review date predates its evidence or lists empty citations", () => {
    const early = dataset();
    first(early).criteria.fees = { ...scored(60), reviewedAt: "2026-09-09" };
    expect(() => parseBankProfilesDataset(early)).toThrow(/earlier than a citation/);

    const empty = dataset();
    first(empty).criteria.security = {
      status: "insufficient-evidence",
      reason: "No citable source.",
      summaryPtBr: "Sem fonte citável.",
      citations: [],
      reviewedAt: "2026-10-02",
    };
    expect(() => parseBankProfilesDataset(empty)).toThrow();
  });

  it("fails when a criterion has no pt-BR summary for the bank page", () => {
    const raw = dataset();
    const withoutSummary: Record<string, unknown> = scored(60);
    delete withoutSummary.summaryPtBr;
    first(raw).criteria.fees = withoutSummary;
    expect(() => parseBankProfilesDataset(raw)).toThrow();

    const blank = dataset();
    first(blank).criteria.fees = { ...scored(60), summaryPtBr: "  " };
    expect(() => parseBankProfilesDataset(blank)).toThrow();
  });

  it("fails on a score outside 0 to 100 or with decimals", () => {
    for (const score of [101, -1, 72.5]) {
      const raw = dataset();
      first(raw).criteria.fees = scored(score);
      expect(() => parseBankProfilesDataset(raw), String(score)).toThrow();
    }
  });

  it("fails when a criterion is missing or unknown", () => {
    const missing = dataset();
    delete first(missing).criteria.fees;
    expect(() => parseBankProfilesDataset(missing)).toThrow();

    const extra = dataset();
    first(extra).criteria.vibes = scored(60);
    expect(() => parseBankProfilesDataset(extra)).toThrow();
  });

  it("fails on an unknown, duplicate or missing institution", () => {
    const unknown = dataset();
    first(unknown).institutionId = "banco-imaginario";
    expect(() => parseBankProfilesDataset(unknown)).toThrow(
      /unknown institution .*banco-imaginario/,
    );

    const duplicate = dataset();
    duplicate.profiles.push(first(duplicate));
    expect(() => parseBankProfilesDataset(duplicate)).toThrow(/duplicate profile .*nubank/);

    const missing = dataset();
    missing.profiles.pop();
    expect(() => parseBankProfilesDataset(missing)).toThrow(/mercado-pago.* has no profile/);
  });

  describe("accountTypes", () => {
    it("accepts a not-offered type with citations and an optional conditionPtBr", () => {
      const raw = dataset();
      first(raw).accountTypes.shared = {
        ...accountType("not-offered"),
        conditionPtBr: "só no Ultravioleta",
      };
      const [parsed] = parseBankProfilesDataset(raw);
      expect(parsed?.accountTypes.shared).toMatchObject({
        status: "not-offered",
        conditionPtBr: "só no Ultravioleta",
      });
    });

    it("accepts a not-found type without citations", () => {
      const raw = dataset();
      first(raw).accountTypes.mei = accountType("not-found");
      expect(parseBankProfilesDataset(raw)[0]?.accountTypes.mei.status).toBe("not-found");
    });

    it("fails when an offered or not-offered type has no citation", () => {
      const offered = dataset();
      first(offered).accountTypes.joint = { ...accountType("offered"), citations: [] };
      expect(() => parseBankProfilesDataset(offered)).toThrow();

      const notOffered = dataset();
      first(notOffered).accountTypes.joint = { ...accountType("not-offered"), citations: [] };
      expect(() => parseBankProfilesDataset(notOffered)).toThrow();
    });

    it("fails when reviewedAt predates a citation's checkedAt", () => {
      const raw = dataset();
      first(raw).accountTypes.joint = { ...accountType("offered"), reviewedAt: "2026-09-09" };
      expect(() => parseBankProfilesDataset(raw)).toThrow(/earlier than a citation/);
    });

    it("fails when an account type has no pt-BR summary", () => {
      const raw = dataset();
      const withoutSummary: Record<string, unknown> = accountType("offered");
      delete withoutSummary.summaryPtBr;
      first(raw).accountTypes.joint = withoutSummary;
      expect(() => parseBankProfilesDataset(raw)).toThrow();
    });

    it("fails when an account type is missing or unknown", () => {
      const missing = dataset();
      delete first(missing).accountTypes.mei;
      expect(() => parseBankProfilesDataset(missing)).toThrow();

      const extra = dataset();
      first(extra).accountTypes.cryptoWallet = accountType("offered");
      expect(() => parseBankProfilesDataset(extra)).toThrow();
    });
  });
});
