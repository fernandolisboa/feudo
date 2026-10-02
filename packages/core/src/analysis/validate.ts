import type { AnalysisInput, AnalysisOutput } from "./contract";
import { extractNumberTokens } from "./numbers";

type AnalysisViolationField = "reading" | "tradeOffs" | "counterArgument";

export type AnalysisViolation =
  | { kind: "unsupported_number"; token: string; field: AnalysisViolationField }
  | { kind: "unknown_citation"; key: string };

function allowedNumberTokens(input: AnalysisInput): Set<string> {
  const allowed = new Set<string>();
  for (const token of extractNumberTokens(input.monthLabel)) {
    allowed.add(token);
  }
  for (const fact of input.facts) {
    for (const token of [...extractNumberTokens(fact.label), ...extractNumberTokens(fact.value)]) {
      allowed.add(token);
    }
  }
  return allowed;
}

function unsupportedNumberViolations(
  field: AnalysisViolationField,
  text: string,
  allowed: Set<string>,
  reported: Set<string>,
): AnalysisViolation[] {
  const violations: AnalysisViolation[] = [];
  for (const token of extractNumberTokens(text)) {
    const reportedKey = `${field}:${token}`;
    if (allowed.has(token) || reported.has(reportedKey)) {
      continue;
    }
    reported.add(reportedKey);
    violations.push({ kind: "unsupported_number", token, field });
  }
  return violations;
}

export function findAnalysisViolations(
  input: AnalysisInput,
  output: AnalysisOutput,
): AnalysisViolation[] {
  const allowed = allowedNumberTokens(input);
  const reportedNumbers = new Set<string>();
  const violations: AnalysisViolation[] = [
    ...unsupportedNumberViolations("reading", output.reading, allowed, reportedNumbers),
  ];
  for (const tradeOff of output.tradeOffs) {
    violations.push(
      ...unsupportedNumberViolations("tradeOffs", tradeOff, allowed, reportedNumbers),
    );
  }
  violations.push(
    ...unsupportedNumberViolations(
      "counterArgument",
      output.counterArgument,
      allowed,
      reportedNumbers,
    ),
  );

  const factKeys = new Set(input.facts.map((fact) => fact.key));
  const reportedKeys = new Set<string>();
  for (const key of output.citedKeys) {
    if (!factKeys.has(key) && !reportedKeys.has(key)) {
      reportedKeys.add(key);
      violations.push({ kind: "unknown_citation", key });
    }
  }

  return violations;
}

export function describeViolations(violations: readonly AnalysisViolation[]): string {
  const numbers: string[] = [];
  const keys: string[] = [];
  for (const violation of violations) {
    if (violation.kind === "unsupported_number") {
      if (!numbers.includes(violation.token)) {
        numbers.push(violation.token);
      }
    } else if (!keys.includes(violation.key)) {
      keys.push(violation.key);
    }
  }

  const sentences: string[] = [];
  if (numbers.length > 0) {
    sentences.push(`Numbers not present in the inputs: ${numbers.join(", ")}.`);
  }
  if (keys.length > 0) {
    sentences.push(`Unknown input keys: ${keys.join(", ")}.`);
  }
  return sentences.join(" ");
}
