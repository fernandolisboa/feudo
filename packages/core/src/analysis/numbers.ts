const NUMBER_TOKEN_PATTERN = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;

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
  return (text.match(NUMBER_TOKEN_PATTERN) ?? []).map(canonicalizeNumberToken);
}
