const DIACRITIC_MARKS = /[̀-ͯ]/g;
const NON_ALPHANUMERIC_RUN = /[^A-Z0-9]+/g;
const NUMERIC_TOKEN = /^[0-9]+$/;

export function normalizeDescription(text: string): string {
  return text
    .normalize("NFD")
    .replace(DIACRITIC_MARKS, "")
    .toUpperCase()
    .replace(NON_ALPHANUMERIC_RUN, " ")
    .trim();
}

export function rulePatternFromDescription(text: string): string {
  const normalized = normalizeDescription(text);
  const nonNumericTokens = normalized
    .split(" ")
    .filter((token) => token !== "" && !NUMERIC_TOKEN.test(token));
  return nonNumericTokens.length > 0 ? nonNumericTokens.join(" ") : normalized;
}

export function matchesPattern(normalizedDescription: string, normalizedPattern: string): boolean {
  if (normalizedPattern === "") {
    return false;
  }
  return ` ${normalizedDescription} `.includes(` ${normalizedPattern} `);
}
