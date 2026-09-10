const HEX_COLOR_PATTERN = /^#?([0-9a-f]{6})$/i;

export class InvalidHexColorError extends Error {
  constructor(value: string) {
    super(`Expected a 6-digit hex colour, received "${value}"`);
    this.name = "InvalidHexColorError";
  }
}

function parseHexChannel(hex: string, start: number): number {
  return parseInt(hex.slice(start, start + 2), 16) / 255;
}

function linearize(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hexColor: string): number {
  const match = HEX_COLOR_PATTERN.exec(hexColor);
  if (!match) {
    throw new InvalidHexColorError(hexColor);
  }
  const hex = match[1] as string;
  const red = linearize(parseHexChannel(hex, 0));
  const green = linearize(parseHexChannel(hex, 2));
  const blue = linearize(parseHexChannel(hex, 4));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(hexColorA: string, hexColorB: string): number {
  const luminanceA = relativeLuminance(hexColorA);
  const luminanceB = relativeLuminance(hexColorB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}
