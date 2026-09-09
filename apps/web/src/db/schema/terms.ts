import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

export const termsAcceptances = pgTable("terms_acceptances", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
});
