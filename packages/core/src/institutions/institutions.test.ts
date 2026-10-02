import { describe, expect, it } from "vitest";

import { INSTITUTIONS_DATASET } from "./institutions-data";
import { parseInstitutionsDataset } from "./institution";
import { INSTITUTIONS, institutionById } from "./institutions";

const EXPECTED_IDS = [
  "nubank",
  "inter",
  "itau",
  "bradesco",
  "banco-do-brasil",
  "caixa",
  "santander",
  "c6",
  "btg",
  "xp",
  "sicoob",
  "picpay",
  "mercado-pago",
];

function cloneDataset() {
  return JSON.parse(JSON.stringify(INSTITUTIONS_DATASET)) as {
    version: number;
    institutions: Record<string, unknown>[];
  };
}

describe("institutions dataset", () => {
  it("loads and validates the thirteen institutions in scope", () => {
    expect(INSTITUTIONS.map((institution) => institution.id)).toEqual(EXPECTED_IDS);
  });

  it("finds an institution by id", () => {
    expect(institutionById("inter")?.accountHolder.ispb).toBe("00416968");
    expect(institutionById("unknown")).toBeUndefined();
  });

  it("puts every bank account holder inside its own FGC conglomerate", () => {
    for (const institution of INSTITUTIONS) {
      const guarantee = institution.depositGuarantee;
      if (guarantee.fund !== "FGC" || institution.accountHolder.kind !== "bank") continue;
      const memberBases = guarantee.coveredMembers.map((member) => member.cnpjBase);
      expect(memberBases, institution.id).toContain(institution.accountHolder.cnpjBase);
    }
  });

  it("never lists a payment institution as an FGC-covered member", () => {
    for (const institution of INSTITUTIONS) {
      const guarantee = institution.depositGuarantee;
      if (institution.accountHolder.kind !== "payment-institution") continue;
      expect(guarantee.fund).toBe("FGC");
      if (guarantee.fund !== "FGC") continue;
      const memberBases = guarantee.coveredMembers.map((member) => member.cnpjBase);
      expect(memberBases, institution.id).not.toContain(institution.accountHolder.cnpjBase);
    }
  });

  it("covers Sicoob through FGCoop per associated cooperative", () => {
    expect(institutionById("sicoob")?.depositGuarantee).toEqual({
      fund: "FGCoop",
      scope: "per-associated-institution",
    });
  });

  it("fails when an institution has no citation", () => {
    const dataset = cloneDataset();
    dataset.institutions[0] = { ...dataset.institutions[0], citations: [] };
    expect(() => parseInstitutionsDataset(dataset)).toThrow();
  });

  it("fails when the review date predates a citation", () => {
    const dataset = cloneDataset();
    dataset.institutions[0] = { ...dataset.institutions[0], reviewedAt: "2026-09-01" };
    expect(() => parseInstitutionsDataset(dataset)).toThrow(/earlier than a citation/);
  });

  it("fails on a duplicate id", () => {
    const dataset = cloneDataset();
    dataset.institutions.push(dataset.institutions[0] as Record<string, unknown>);
    expect(() => parseInstitutionsDataset(dataset)).toThrow(/duplicate institution id .*nubank/);
  });

  it("fails on an FGC guarantee with no covered member", () => {
    const dataset = cloneDataset();
    const first = dataset.institutions[0] as { depositGuarantee: Record<string, unknown> };
    first.depositGuarantee = { ...first.depositGuarantee, coveredMembers: [] };
    expect(() => parseInstitutionsDataset(dataset)).toThrow();
  });
});
