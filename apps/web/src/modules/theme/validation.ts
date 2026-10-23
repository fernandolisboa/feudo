import { z } from "zod";

import { SHELL_LAYOUTS, THEME_NAMES } from "./tokens";

export const updateThemeFormSchema = z.object({
  theme: z.enum(THEME_NAMES),
});

export const updateLayoutFormSchema = z.object({
  layout: z.enum(SHELL_LAYOUTS),
});
