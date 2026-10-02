// A minus sign (hyphen or U+2212) counts only when it starts a word, so a
// date or range such as "2026-09" keeps its parts unsigned; it may sit before
// "R$", as Intl writes a negative amount ("-R$ 1.234,56"). The sign is part of
// the token: an answer that drops it turns a deficit into a surplus.
const NUMBER_TOKEN_PATTERN =
  /(?:(?<![\p{L}\p{N}])([-\u2212])(?:R\$[^\S\r\n]?)?)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)/gu;

function stripLeadingZeros(digits: string): string {
  return digits.replace(/^0+(?=\d)/, "");
}

function stripTrailingZeros(digits: string): string {
  return digits.replace(/0+$/, "");
}

function canonicalizeNumberToken(rawToken: string): string {
  const commaIndex = rawToken.indexOf(",");
  const integerPart = commaIndex === -1 ? rawToken : rawToken.slice(0, commaIndex);
  const integerCanonical = stripLeadingZeros(integerPart.replace(/\./g, ""));
  if (commaIndex === -1) {
    return integerCanonical;
  }
  const decimalCanonical = stripTrailingZeros(rawToken.slice(commaIndex + 1));
  return decimalCanonical === "" ? integerCanonical : `${integerCanonical}.${decimalCanonical}`;
}

export function extractNumberTokens(text: string): string[] {
  return [...text.matchAll(NUMBER_TOKEN_PATTERN)].map(([, sign, digits = ""]) => {
    const magnitude = canonicalizeNumberToken(digits);
    return sign === undefined || magnitude === "0" ? magnitude : `-${magnitude}`;
  });
}
