export const THEME_NAMES = ["caderno", "painel", "sala"] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME: ThemeName = "caderno";

export function isThemeName(value: string): value is ThemeName {
  return (THEME_NAMES as readonly string[]).includes(value);
}

export type ShellLayout = "sidebar" | "topnav";

export type ThemeDefinition = {
  shell: ShellLayout;
};

export const themeRegistry: Record<ThemeName, ThemeDefinition> = {
  caderno: { shell: "sidebar" },
  painel: { shell: "sidebar" },
  sala: { shell: "topnav" },
};

export function shellLayoutFor(theme: ThemeName): ShellLayout {
  return themeRegistry[theme].shell;
}
