import { z } from "zod";

import { TOUR_IDS } from "./tours";

export const recordTourOutcomeSchema = z.object({
  tourId: z.enum(TOUR_IDS),
  outcome: z.enum(["completed", "dismissed"]),
  turnOffAutoStart: z.boolean(),
});

export const tourAutoStartFormSchema = z.object({
  autoStart: z.enum(["on", "off"]).transform((value) => value === "on"),
});
