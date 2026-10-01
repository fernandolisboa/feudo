import { integer, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/schema.ts";

export const tourOutcomeEnum = pgEnum("tour_outcome", ["completed", "dismissed"]);

// User-scoped (ADR-0001): guided-tour progress belongs to the person, not the
// household, so a partner who joins later still gets their own tours.
export const userTour = pgTable(
  "user_tour",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tourId: text("tour_id").notNull(),
    tourVersion: integer("tour_version").notNull(),
    outcome: tourOutcomeEnum("outcome").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.tourId] })],
);
