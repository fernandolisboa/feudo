import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization } from "../auth/schema.ts";

export const householdSettings = pgTable("household_settings", {
  householdId: text("household_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  timeZone: text("time_zone").notNull(),
  reserveMultiple: integer("reserve_multiple").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
