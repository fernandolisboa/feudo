const DIACRITIC_MARKS = /[̀-ͯ]/g;
const NON_ALPHANUMERIC_RUN = /[^A-Z0-9]+/g;
const NUMERIC_TOKEN = /^[0-9]+$/;

// One card issuer glues its installment counter to the truncated merchant
// name ("SOME MERCHANTPARC10/12", normalized to "SOME MERCHANTPARC10 12"
// before this runs), so every installment of the same purchase would
// otherwise normalize to a different text and never group under one rule or
// suggestion. Anchored at the end only, and only with exactly two digits on
// each side, so a merchant name that happens to contain "PARC" elsewhere, or
// followed by a differently shaped number, is left alone. The total is
// required here because a description always carries it; stripping runs in
// a loop so a card issuer's own re-statement of several installments on one
// line ("PARC01 02 PARC03 04") still reaches its final shape in one call,
// and a text that is only the marker is left alone rather than stripped
// down to nothing.
const TRAILING_INSTALLMENT_MARKER = /PARC[0-9]{2} [0-9]{2}$/;

export function stripInstallmentMarker(text: string): string {
  let current = text;
  for (;;) {
    const stripped = current.replace(TRAILING_INSTALLMENT_MARKER, "").trim();
    if (stripped === "" || stripped === current) {
      return current;
    }
    current = stripped;
  }
}

// A rule pattern stored before this normalization existed can carry only the
// counter, with no total: rulePatternFromDescription already dropped the
// total as a purely numeric token, leaving "SOME STORE PARC03" on the stored
// row. This strips a stored rule pattern, never a transaction description,
// so the total is optional rather than required as it is above; orderRules
// is the only caller, and guards the result against becoming too short to
// use as a pattern.
const STORED_PATTERN_INSTALLMENT_MARKER = /PARC[0-9]{2}(?: [0-9]{2})?$/;

export function stripStoredPatternInstallmentMarker(pattern: string): string {
  return pattern.replace(STORED_PATTERN_INSTALLMENT_MARKER, "").trim();
}

// The accent-folding, case-folding and punctuation-collapsing step alone,
// with no installment-marker stripping: a search box folds a query and a
// row's description the same way without also erasing the marker a member
// is searching for ("PARC03/10"), which normalizeDescription's extra step
// would.
export function foldDescription(text: string): string {
  return text
    .normalize("NFD")
    .replace(DIACRITIC_MARKS, "")
    .toUpperCase()
    .replace(NON_ALPHANUMERIC_RUN, " ")
    .trim();
}

export function normalizeDescription(text: string): string {
  return stripInstallmentMarker(foldDescription(text));
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
