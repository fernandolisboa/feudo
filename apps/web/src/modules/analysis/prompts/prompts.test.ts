import { createHash } from "node:crypto";

import { analysisOutputSchema, findAnalysisViolations } from "@feudo/core";
import { describe, expect, it } from "vitest";

import { FIXTURE_INPUT, FIXTURE_OUTPUT } from "../test/fixtures";
import { ANALYST_V1_SYSTEM, ANALYST_V1_VERSION, renderAnalystV1User } from "./analyst-v1";
import { ANALYST_V2_SYSTEM, ANALYST_V2_VERSION } from "./analyst-v2";
import { CURRENT_ANALYST_PROMPT } from "./index";

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

// A stored reading names the prompt version it was written with (ADR-0004),
// so a version's text can never change after it ships: editing it means a
// new file and a new version, and this pin fails until that is done.
const ANALYST_V1_SYSTEM_SHA256 = "569899323d7b604f660c12636eed643ac9d9446ebbf8e154931da422a4572cee";
const ANALYST_V2_SYSTEM_SHA256 = "c74962030e39d011f54b8c2d3842e7a45d4d8ceff3a9620dfb5ecf48afdbbea0";

describe("analyst prompt v1", () => {
  it("is frozen", () => {
    expect(ANALYST_V1_VERSION).toBe("analyst-v1");
    expect(sha256(ANALYST_V1_SYSTEM)).toBe(ANALYST_V1_SYSTEM_SHA256);
  });

  it("states the contract the validator enforces", () => {
    expect(ANALYST_V1_SYSTEM).toContain("must appear exactly as written");
    expect(ANALYST_V1_SYSTEM).toContain("citedKeys");
    expect(ANALYST_V1_SYSTEM).toContain("counterArgument");
    expect(ANALYST_V1_SYSTEM).toContain("Brazilian Portuguese");
  });

  it("hands the model every fact with its key, label and value", () => {
    const user = renderAnalystV1User(FIXTURE_INPUT, null);

    expect(user).toContain("Reading: monthly reading");
    expect(user).toContain("Month analysed: setembro de 2026");
    for (const fact of FIXTURE_INPUT.facts) {
      expect(user).toContain(`- ${fact.key} | ${fact.label} | ${fact.value}`);
    }
    expect(user).not.toContain("rejected");
  });

  it("names what was wrong when it asks again", () => {
    const user = renderAnalystV1User(
      { ...FIXTURE_INPUT, kind: "on_demand" },
      "Numbers not present in the inputs: 3.",
    );

    expect(user).toContain("Reading: on-demand reading");
    expect(user).toContain(
      "Your previous answer was rejected. Numbers not present in the inputs: 3.",
    );
  });

  it("has a fixture answer that meets the contract", () => {
    const output = analysisOutputSchema.parse(FIXTURE_OUTPUT);

    expect(findAnalysisViolations(FIXTURE_INPUT, output)).toEqual([]);
  });
});

describe("analyst prompt v2", () => {
  it("is frozen", () => {
    expect(ANALYST_V2_VERSION).toBe("analyst-v2");
    expect(sha256(ANALYST_V2_SYSTEM)).toBe(ANALYST_V2_SYSTEM_SHA256);
  });

  it("is the prompt in use, with analyst-v1's user message", () => {
    expect(CURRENT_ANALYST_PROMPT.version).toBe(ANALYST_V2_VERSION);
    expect(CURRENT_ANALYST_PROMPT.system).toBe(ANALYST_V2_SYSTEM);
    expect(CURRENT_ANALYST_PROMPT.renderUser).toBe(renderAnalystV1User);
  });

  it("keeps v1's rules and asks for the summary and the bank paragraph", () => {
    const rules = (system: string) => system.slice(0, system.indexOf("Fields:"));

    expect(rules(ANALYST_V2_SYSTEM)).toBe(rules(ANALYST_V1_SYSTEM));
    expect(ANALYST_V2_SYSTEM).toContain("- summary:");
    expect(ANALYST_V2_SYSTEM).toContain("- banks:");
    expect(ANALYST_V2_SYSTEM).toContain("this household's situation");
  });
});
