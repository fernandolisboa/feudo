import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Test-only: written by FakeEmailSender when EMAIL_PROVIDER=fake, read by
// /api/test-only/last-email. Never written in production (see ADR-0008); no
// household or user scoping because it holds no personal or financial data.
export const fakeSentEmails = pgTable("fake_sent_emails", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  text: text("text").notNull(),
  html: text("html").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});
