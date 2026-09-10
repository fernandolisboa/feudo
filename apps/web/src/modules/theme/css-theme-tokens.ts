export type CssCustomProperties = Record<string, string>;

const THEME_BLOCK_PATTERN = /\[data-theme="([a-z]+)"\]\s*\{([^{}]*)\}/g;
const DATA_SHELL_PATTERN = /data-shell="([a-z]+)"/g;

function parseDeclarations(block: string): CssCustomProperties {
  const properties: CssCustomProperties = {};
  for (const declaration of block.split(";")) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }
    const property = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();
    if (property.startsWith("--") && value.length > 0) {
      properties[property] = value;
    }
  }
  return properties;
}

export function parseThemeCssBlocks(css: string): Record<string, CssCustomProperties> {
  const themes: Record<string, CssCustomProperties> = {};
  for (const match of css.matchAll(THEME_BLOCK_PATTERN)) {
    const themeName = match[1];
    const block = match[2];
    if (!themeName || block === undefined) {
      continue;
    }
    themes[themeName] = { ...themes[themeName], ...parseDeclarations(block) };
  }
  return themes;
}

export function parseDataShellValues(css: string): Set<string> {
  const values = new Set<string>();
  for (const match of css.matchAll(DATA_SHELL_PATTERN)) {
    const shell = match[1];
    if (shell) {
      values.add(shell);
    }
  }
  return values;
}
