const DIACRITIC_MARKS = /[̀-ͯ]/g;
const NON_ALPHANUMERIC_RUN = /[^A-Z0-9]+/g;
const NUMERIC_TOKEN = /^[0-9]+$/;

// One card issuer glues its instalment counter to the truncated merchant
// name ("SOME MERCHANTPARC10/12", normalized to "SOME MERCHANTPARC10 12"
// before this runs), so every instalment of the same purchase would
// otherwise normalize to a different text and never group under one rule or
// suggestion. Anchored at the end only, and only with exactly two digits on
// each side, so a merchant name that happens to contain "PARC" elsewhere, or
// followed by a differently shaped number, is left alone. The total ("/12")
// is optional because a pattern derived from this text before this rule
// existed already dropped it as a purely numeric token, leaving only the
// counter ("SOME STORE PARC03") on the stored pattern.
const TRAILING_INSTALLMENT_MARKER = /PARC[0-9]{2}(?: [0-9]{2})?$/;

export function stripInstallmentMarker(text: string): string {
  return text.replace(TRAILING_INSTALLMENT_MARKER, "").trim();
}

export function normalizeDescription(text: string): string {
  const normalized = text
    .normalize("NFD")
    .replace(DIACRITIC_MARKS, "")
    .toUpperCase()
    .replace(NON_ALPHANUMERIC_RUN, " ")
    .trim();
  return stripInstallmentMarker(normalized);
}

// matchesPattern requires a contiguous token run, so the pattern proposed
// here must be one too: dropping numeric tokens wherever they sit (as a
// simple filter would) can scatter the survivors across a description that
// never matches its own suggested pattern (e.g. a card number in the
// middle). The longest contiguous non-numeric run is the biggest fragment
// still guaranteed to appear as a run in the original description; on a tie
// the last run wins, because bank statements put the generic operation
// ("COMPRA CARTAO") before the card number and the merchant after it.
export function rulePatternFromDescription(text: string): string {
  const normalized = normalizeDescription(text);
  const tokens = normalized.split(" ").filter((token) => token !== "");

  let bestStart = 0;
  let bestLength = 0;
  let runStart = -1;
  for (let index = 0; index <= tokens.length; index += 1) {
    const isNumeric = index < tokens.length && NUMERIC_TOKEN.test(tokens[index] ?? "");
    if (index < tokens.length && !isNumeric) {
      if (runStart === -1) {
        runStart = index;
      }
      continue;
    }
    if (runStart !== -1) {
      const runLength = index - runStart;
      if (runLength >= bestLength) {
        bestLength = runLength;
        bestStart = runStart;
      }
      runStart = -1;
    }
  }

  return bestLength > 0 ? tokens.slice(bestStart, bestStart + bestLength).join(" ") : normalized;
}

export function matchesPattern(normalizedDescription: string, normalizedPattern: string): boolean {
  if (normalizedPattern === "") {
    return false;
  }
  return ` ${normalizedDescription} `.includes(` ${normalizedPattern} `);
}
