export const THEME_NAMES = ["caderno", "painel", "sala"] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME: ThemeName = "caderno";

export function isThemeName(value: string): value is ThemeName {
  return (THEME_NAMES as readonly string[]).includes(value);
}

export type ShellLayout = "sidebar" | "topnav";

export type ThemeColorTokens = {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  lineSoft: string;
  ink: string;
  muted: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  chart1: string;
  chart2: string;
  warning: string;
  danger: string;
};

export type ThemeDefinition = {
  shell: ShellLayout;
  colors: ThemeColorTokens;
};

export const themeRegistry: Record<ThemeName, ThemeDefinition> = {
  caderno: {
    shell: "sidebar",
    colors: {
      bg: "#f4efe6",
      surface: "#fbf8f2",
      surface2: "#ece5d8",
      line: "#d9d0c2",
      lineSoft: "#e6dfd3",
      ink: "#2a2622",
      muted: "#6f675d",
      accent: "#4f6f52",
      accentHover: "#3a5440",
      accentSoft: "#e2ebe0",
      chart1: "#3d8756",
      chart2: "#6a63c9",
      warning: "#7a5f18",
      danger: "#a33a2e",
    },
  },
  painel: {
    shell: "sidebar",
    colors: {
      bg: "#f3f4f6",
      surface: "#ffffff",
      surface2: "#eef4fc",
      line: "#dde0e6",
      lineSoft: "#eceef2",
      ink: "#16181d",
      muted: "#5c6370",
      accent: "#1f5fae",
      accentHover: "#174a8a",
      accentSoft: "#eef4fc",
      chart1: "#2a78d6",
      chart2: "#c96a2a",
      warning: "#7a5f18",
      danger: "#b3261e",
    },
  },
  sala: {
    shell: "topnav",
    colors: {
      bg: "#f8f6f2",
      surface: "#ffffff",
      surface2: "#eeeae3",
      line: "#e4dfd6",
      lineSoft: "#eeeae3",
      ink: "#26231f",
      muted: "#6b665f",
      accent: "#2a7268",
      accentHover: "#23615a",
      accentSoft: "#e3f1ee",
      chart1: "#12907e",
      chart2: "#c96a2a",
      warning: "#7a5f18",
      danger: "#a33a2e",
    },
  },
};

export function shellLayoutFor(theme: ThemeName): ShellLayout {
  return themeRegistry[theme].shell;
}
