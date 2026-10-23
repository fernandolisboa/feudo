export const THEME_NAMES = [
  "caderno",
  "painel",
  "sala",
  "varanda",
  "nitido",
  "lamparina",
  "cofre",
] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME: ThemeName = "caderno";

export function isThemeName(value: string): value is ThemeName {
  return (THEME_NAMES as readonly string[]).includes(value);
}

export function resolveTheme(value: string | null | undefined): ThemeName {
  return typeof value === "string" && isThemeName(value) ? value : DEFAULT_THEME;
}

export type ColorScheme = "light" | "dark";

export type ThemeDefinition = {
  scheme: ColorScheme;
};

export const themeRegistry: Record<ThemeName, ThemeDefinition> = {
  caderno: { scheme: "light" },
  painel: { scheme: "light" },
  sala: { scheme: "light" },
  varanda: { scheme: "light" },
  nitido: { scheme: "light" },
  lamparina: { scheme: "dark" },
  cofre: { scheme: "dark" },
};

export function colorSchemeFor(theme: ThemeName): ColorScheme {
  return themeRegistry[theme].scheme;
}

export const SHELL_LAYOUTS = ["sidebar", "topnav", "dock"] as const;

export type ShellLayout = (typeof SHELL_LAYOUTS)[number];

export const DEFAULT_SHELL_LAYOUT: ShellLayout = "sidebar";

export function isShellLayout(value: string): value is ShellLayout {
  return (SHELL_LAYOUTS as readonly string[]).includes(value);
}

export function resolveShellLayout(value: string | null | undefined): ShellLayout {
  return typeof value === "string" && isShellLayout(value) ? value : DEFAULT_SHELL_LAYOUT;
}
