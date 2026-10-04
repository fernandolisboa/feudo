import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth/schema.ts";

// User-scoped (ADR-0001, ADR-0012): one row per device where a person turned
// notifications on. The endpoint and its two public keys are all the browser
// hands over; nothing here names a household or carries an amount. The
// endpoint is unique because a device has one subscription, held by whoever
// turned notifications on there last.
export const pushSubscription = pgTable(
  "push_subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("push_subscription_endpoint_uidx").on(table.endpoint),
    index("push_subscription_user_created_idx").on(table.userId, table.createdAt),
  ],
);
