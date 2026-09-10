import { z } from "zod";

import { THEME_NAMES } from "./tokens";

export const updateThemeFormSchema = z.object({
  theme: z.enum(THEME_NAMES),
});
