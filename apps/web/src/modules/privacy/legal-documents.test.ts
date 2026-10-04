import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { TERMS_VERSION } from "@/modules/auth";

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTROLLER,
  legal,
  type LegalBlock,
  type LegalDocument,
} from "./legal-documents";

function documentText(document: LegalDocument): string {
  const blocks: LegalBlock[] = document.sections.flatMap((section) => [...section.blocks]);
  return [document.intro, ...blocks.flat()].join("\n");
}

const policy = documentText(legal.privacy);
const terms = documentText(legal.terms);

describe("privacy policy", () => {
  it.each(["Pluggy", "Anthropic", "Vercel", "Neon", "Resend"])(
    "names %s, a third party that receives personal data (ADR-0008)",
    (processor) => {
      expect(policy).toContain(processor);
    },
  );

  it("states the retention rules the code enforces", () => {
    expect(policy).toContain("Registro de acesso: 12 meses");
    expect(policy).toContain("7 dias");
    expect(policy).toContain("24 horas");
  });

  it("says how many exports a user can download per day", () => {
    expect(policy).toContain("até 3 downloads a cada 24 horas");
  });

  it("identifies the controller and a contact channel", () => {
    expect(policy).toContain("{controller}");
    expect(policy).toContain("{contact}");
  });
});

describe("terms of use", () => {
  it("states the analyst reading is not investment advice", () => {
    expect(terms).toContain("Não é recomendação, consultoria nem análise de valores mobiliários");
  });

  it("describes the 7-day grace of account and household deletion", () => {
    expect(terms).toContain("Por 7 dias, você pode cancelar entrando de novo");
    expect(terms).toContain("pode ser restaurada pelo responsável por 7 dias");
  });
});

describe("placeholders", () => {
  it("uses only {controller} and {contact}", () => {
    const placeholders = `${policy}\n${terms}`.match(/\{[a-z]+\}/g) ?? [];
    expect(new Set(placeholders)).toEqual(new Set(["{controller}", "{contact}"]));
  });
});

describe("versioning", () => {
  // Every person already registered accepted the text pinned here. Changing a
  // word of it without a new TERMS_VERSION would hold them to text they never
  // saw, so a text change must bump the version and then update this pin.
  it("pins the shipped text to TERMS_VERSION", () => {
    const shipped = JSON.stringify([
      LEGAL_CONTROLLER,
      LEGAL_CONTACT_EMAIL,
      legal.terms,
      legal.privacy,
    ]);
    const digest = createHash("sha256").update(shipped).digest("hex");

    expect({ version: TERMS_VERSION, digest }).toEqual({
      version: "2026-10-05",
      digest: "12053bb1e83e25150df0928f2909c67c368c5cf49c92c2895f1d9d5fdd6f0bbb",
    });
  });
});
